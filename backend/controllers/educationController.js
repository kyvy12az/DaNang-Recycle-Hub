const { createClient } = require('@supabase/supabase-js');
const Education = require('../models/Education');

// cấu hình Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("CẢNH BÁO: Thiếu cấu hình SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong file .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Lấy danh sách toàn bộ bài viết
exports.getAllPosts = async (req, res) => {
    try {
        const posts = await Education.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: posts.length,
            data: posts
        });
    } catch (error) {
        console.error("Lỗi khi lấy bài viết: ", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Chi tiết một bài viết theo ID
exports.getPostById = async (req, res) => {
    try {
        const post = await Education.findById(req.params.id);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bài viết"
            });
        }
        res.status(200).json({
            success: true,
            data: post
        });
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết bài viết: ", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Tạo bài viết
exports.createPost = async (req, res) => {
    try {
        let coverImageUrl = req.body.coverImage || '';

        if (req.file) {
            const file = req.file;
            const fileExt = file.originalname.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `covers/${fileName}`;

            const { data, error } = await supabase.storage
                .from('education_images')
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true
                });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from('education_images')
                .getPublicUrl(filePath);

            coverImageUrl = publicUrlData.publicUrl;
        }

        const newPost = new Education({
            ...req.body,
            coverImage: coverImageUrl 
        });

        await newPost.save();

        res.status(201).json({ success: true, data: newPost });
    } catch (error) {
        console.error("Lỗi khi tạo bài viết:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// cập nhật bài viết
exports.updatePost = async (req, res) => {
    try {
        let coverImageUrl = req.body.coverImage;
        if (req.file) {
            const file = req.file;
            const fileExt = file.originalname.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `covers/${fileName}`;

            const { error } = await supabase.storage
                .from('education_images')
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true
                });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from('education_images')
                .getPublicUrl(filePath);

            coverImageUrl = publicUrlData.publicUrl;
        }

        const updatedData = { ...req.body };
        if (coverImageUrl) {
            updatedData.coverImage = coverImageUrl;
        }

        const post = await Education.findByIdAndUpdate(
            req.params.id,
            updatedData,
            { new: true, runValidators: true }
        );

        if (!post) {
            return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
        }

        // Kích hoạt socket realtime thông báo đổi dữ liệu (nếu có)
        if (global.io) {
            global.io.emit("education_updated");
        }

        res.status(200).json({ success: true, data: post });
    } catch (error) {
        console.error("Lỗi khi cập nhật bài viết:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Xóa bài viết
exports.deletePost = async (req, res) => {
    try {
        const post = await Education.findByIdAndDelete(req.params.id);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Xóa bài viết thành công',
        });
    } catch (error) {
        console.error("Lỗi khi xóa bài viết: ", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Thích hoặc bỏ thích bài viết (Toggle Like)
exports.toggleLikePost = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu userId'
            });
        }
        const post = await Education.findById(req.params.id);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        const isLiked = post.likedBy.includes(userId);
        if (isLiked) {
            // nếu đã thích thì xóa khỏi mảng và trừ đi 1 like
            post.likedBy = post.likedBy.filter(id => id !== userId);
            post.likes = Math.max(0, post.likes - 1);
        } else {
            // nếu chưa thích thì thêm vào mảng và cộng 1 like
            post.likedBy.push(userId);
            post.likes += 1;
        }

        await post.save();

        if (global.io) {
            global.io.emit("education:post_liked", {
                postId: post._id,
                likes: post.likes,
                userId: userId
            });
        }

        res.status(200).json({
            success: true,
            likes: post.likes,
            isLiked: !isLiked
        });
    } catch (error) {
        console.error("Lỗi khi like bài viết: ", error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
};

// lấy danh sách bình luận cho bài viết đó
exports.getComments = async (req, res) => {
    try {
        const post = await Education.findById(req.params.id).select('title coverImage comments');
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        let totalCount = 0;
        post.comments.forEach(comment => {
            totalCount += 1;
            if (comment.replies) {
                totalCount += comment.replies.length; 
            }
        });
        
        res.status(200).json({
            success: true,
            data: {
                _id: post._id,
                title: post.title,
                coverImage: post.coverImage,
                totalContributions: totalCount, 
                comments: post.comments
            }
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách bình luận: ", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Tạo bình luận mới cho bài viết
exports.addComment = async (req, res) => {
    try {
        const post = await Education.findById(req.params.id);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bài viết"
            });
        }
        
        const { userId, userName, avatar, content } = req.body;

        const newComment = {
            userId: userId || 'GUEST',
            userName: userName || 'Khách',
            avatar: avatar || `https://api.dicebear.com/7.x/initials/png?seed=${userName || 'Guest'}`,
            content: content,
            likes: 0,
            createdAt: new Date(),
            replies: []
        };

        post.comments.push(newComment);
        await post.save();

        const savedComment = post.comments[post.comments.length - 1];

        if (global.io) {
            global.io.emit("education:comment_added", {
                postId: post._id,
                comment: savedComment
            });
        }

        res.status(201).json({
            success: true,
            message: "Thêm bình luận thành công",
            data: savedComment
        });

    } catch (error) {
        console.error("Lỗi khi thêm bình luận: ", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Trả lời một bình luận
exports.replyComment = async (req, res) => {
    try {
        const { commentId } = req.params; 
        const { userId, userName, avatar, content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Nội dung phản hồi không được để trống"
            });
        }

        const post = await Education.findById(req.params.id);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bài viết"
            });
        }

        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bình luận"
            });
        }

        const newReply = {
            userId: userId || 'GUEST',
            userName: userName || 'Khách',
            avatar: avatar || `https://api.dicebear.com/7.x/initials/png?seed=${userName || 'Guest'}`,
            content: content.trim(),
            likes: 0,
            createdAt: new Date()
        };

        comment.replies.push(newReply);
        await post.save();

        const savedReply = comment.replies[comment.replies.length - 1];

        if (global.io) {
            global.io.emit("education:reply_added", {
                postId: post._id,
                commentId: comment._id,
                reply: savedReply,
                allReplies: comment.replies
            });
        }

        res.status(201).json({
            success: true,
            message: "Phản hồi bình luận thành công",
            data: comment.replies 
        });
        
    } catch (error) {
        console.error("Lỗi khi phản hồi bình luận: ", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Thích/Bỏ thích một bình luận
exports.toggleLikeComment = async (req, res) => {
    try {
        const { userId } = req.body;
        const { commentId } = req.params;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'Thiếu userId' });
        }
        
        const post = await Education.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
        
        const comment = post.comments.id(commentId);
        if (!comment) return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });

        const isLiked = comment.likedBy.includes(userId);
        if (isLiked) {
            comment.likedBy = comment.likedBy.filter(id => id !== userId);
            comment.likes = Math.max(0, comment.likes - 1);
        } else {
            comment.likedBy.push(userId);
            comment.likes += 1;
        }

        await post.save();

        if (global.io) {
            global.io.emit("education:comment_liked", {
                postId: post._id,
                commentId: comment._id,
                likes: comment.likes,
                userId: userId
            });
        }

        res.status(200).json({ success: true, likes: comment.likes, isLiked: !isLiked });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Thích/Bỏ thích một phản hồi
exports.toggleLikeReply = async (req, res) => {
    try {
        const { userId } = req.body;
        const { commentId, replyId } = req.params;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'Thiếu userId' });
        }
        
        const post = await Education.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
        
        const comment = post.comments.id(commentId);
        if (!comment) return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });

        const reply = comment.replies.id(replyId);
        if (!reply) return res.status(404).json({ success: false, message: 'Không tìm thấy phản hồi' });

        const isLiked = reply.likedBy.includes(userId);
        if (isLiked) {
            reply.likedBy = reply.likedBy.filter(id => id !== userId);
            reply.likes = Math.max(0, reply.likes - 1);
        } else {
            reply.likedBy.push(userId);
            reply.likes += 1;
        }

        await post.save();

        if (global.io) {
            global.io.emit("education:reply_liked", {
                postId: post._id,
                commentId: comment._id,
                replyId: reply._id,
                likes: reply.likes,
                userId: userId
            });
        }

        res.status(200).json({ success: true, likes: reply.likes, isLiked: !isLiked });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};