const express = require('express');
const router = express.Router();
const educationController = require('../controllers/educationController');

const multer = require('multer');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } 
});

// quản lý danh sách và tạo bài viết
router.get('/', educationController.getAllPosts);
router.post('/', upload.single('file'), educationController.createPost);

// quản lý chi tiết bài viết, cập nhật và xóa bài viết
router.get('/:id', educationController.getPostById);
router.put('/:id', upload.single('file'), educationController.updatePost);
router.delete('/:id', educationController.deletePost);

// thao tác tương tác (thích & bình luận)
router.post('/:id/toggle-like', educationController.toggleLikePost);
router.post('/:id/comments', educationController.addComment);

// quản lý danh sách comment của bài viết theo ID
router.get('/:id/comments', educationController.getComments);

// thao tác phản hồi bình luận
router.post('/:id/comments/:commentId/replies', educationController.replyComment);

// thích bình luận và phản hồi
router.post('/:id/comments/:commentId/toggle-like', educationController.toggleLikeComment);
router.post('/:id/comments/:commentId/replies/:replyId/toggle-like', educationController.toggleLikeReply);

module.exports = router;