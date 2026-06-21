import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { EducationPost, EducationComment } from "@/data/mockData";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;

interface EducationContextValue {
  posts: EducationPost[];
  loading: boolean;
  getPost: (id: string) => EducationPost | undefined;
  addPost: (data: Omit<EducationPost, "id" | "createdAt" | "likes" | "comments">, file?: File) => Promise<boolean>;
  updatePost: (id: string, data: Partial<EducationPost>) => Promise<boolean>;
  deletePost: (id: string) => Promise<boolean>;
  toggleLike: (id: string) => Promise<void>;
  addComment: (postId: string, content: string, asAdmin?: boolean) => Promise<void>;
  replyComment: (postId: string, commentId: string, content: string) => Promise<void>;
}
const EducationContext = createContext<EducationContextValue | undefined>(undefined);

export function EducationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<EducationPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // tải danh sách bài viết
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/educations`);
      const json = await response.json();
      if (json.success) {
        setPosts(json.data);
      } else {
        toast.error("Không thể lấy danh sách bài viết từ hệ thống");
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Lỗi kết nối máy chủ API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();

    const socket = io(API_URL);

    socket.on("education:comment_added", (data) => {
      setPosts(prev => prev.map(p => {
        if (String(p.id) !== String(data.postId)) return p;
        const exists = (p.comments || []).some((c: any) => String(c._id || c.id) === String(data.comment._id || data.comment.id));
        if (exists) return p;
        return { ...p, comments: [...(p.comments || []), data.comment] };
      }));
    });

    socket.on("education:reply_added", (data) => {
      setPosts(prev => prev.map(p => p.id === data.postId ? {
        ...p,
        comments: (p.comments || []).map((c: any) => (c.id === data.commentId || c._id === data.commentId) ? { ...c, replies: data.allReplies } : c)
      } : p));
    });

    socket.on("education:post_liked", (data) => {
      setPosts(prev => prev.map(p => p.id === data.postId ? { ...p, likes: data.likes } : p));
    });

    socket.on("education:comment_liked", (data) => {
      setPosts(prev => prev.map(p => p.id === data.postId ? {
        ...p,
        comments: (p.comments || []).map((c: any) => (c.id === data.commentId || c._id === data.commentId) ? { ...c, likes: data.likes } : c)
      } : p));
    });

    socket.on("education:reply_liked", (data) => {
      setPosts(prev => prev.map(p => p.id === data.postId ? {
        ...p,
        comments: (p.comments || []).map((c: any) => (c.id === data.commentId || c._id === data.commentId) ? {
          ...c,
          replies: (c.replies || []).map((r: any) => (r.id === data.replyId || r._id === data.replyId) ? { ...r, likes: data.likes } : r)
        } : c)
      } : p));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getPost = (id: string) => posts.find((p) => String(p.id) === String(id));

  // tạo bài viết mới
  const addPost = async (data: any, file?: File): Promise<boolean> => {
    try {
      const formData = new FormData();

      Object.keys(data).forEach((key) => {

        if (key === "coverImage" && file) return;
        formData.append(key, String(data[key]));
      });

      if (file) {
        formData.append("file", file);
      }

      const response = await fetch(`${API_URL}/api/educations`, {
        method: "POST",
        body: formData,
      });

      const json = await response.json();
      if (json.success) {
        const standardNewPost = { ...json.data, id: json.data._id || json.data.id };
        setPosts((prev) => [standardNewPost, ...prev]);
        toast.success("Thêm bài viết mới thành công!");
        return true;
      } else {
        toast.error(json.message || "Tạo bài viết thất bại");
        return false;
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Không thể kết nối đến máy chủ");
      return false;
    }
  };

  // cập nhật bài viết hiện tại
  const updatePost = async (id: string, data: any, file?: File): Promise<boolean> => {
    try {
      const formData = new FormData();

      Object.keys(data).forEach((key) => {
        if (key === "coverImage" && file) return;
        formData.append(key, String(data[key]));
      });

      if (file) {
        formData.append("file", file);
      }

      const response = await fetch(`${API_URL}/api/educations/${id}`, {
        method: "PUT", 
        body: formData,
      });

      const json = await response.json();
      if (json.success) {
        const standardUpdated = { ...json.data, id: json.data._id || json.data.id };
        setPosts((prev) => prev.map((p) => (p.id === id ? standardUpdated : p)));
        toast.success("Cập nhật bài viết thành công!");
        return true;
      } else {
        toast.error(json.message || "Cập nhật thất bại");
        return false;
      }
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Không thể kết nối đến máy chủ");
      return false;
    }
  };

  // xóa bài viết
  const deletePost = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/educations/${id}`, {
        method: "DELETE",
      });
      const json = await response.json();
      if (json.success) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        toast.success("Đã xóa bài viết thành công!");
        return true;
      }
      toast.error(json.message || "Xóa bài viết thất bại");
      return false;
    } catch (error) {
      toast.error("Lỗi mạng, không thể xóa bài viết");
      return false;
    }
  };

  // thích bài viết
  const toggleLike = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/educations/${id}/toggle-like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "CURRENT_ADMIN_ID" }),
      });
      const json = await response.json();
      if (json.success) {
        setPosts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, likes: json.likes } : p))
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // thêm bình luận mới vào bài viết
  const addComment = async (postId: string, content: string, asAdmin = true) => {
    try {
      const response = await fetch(`${API_URL}/api/educations/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          userId: "ADMIN",
          userName: user?.name || "Admin DaNang Recycle",
          avatar: user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || "Admin"}`
        }),
      });
      const json = await response.json();
      if (json.success) {
        setPosts((prev) =>
          prev.map((p) => {
            if (String(p.id) !== String(postId)) return p;
            const exists = (p.comments || []).some((c: any) => String(c._id || c.id) === String(json.data._id || json.data.id));
            if (exists) return p;
            return { ...p, comments: [...(p.comments || []), json.data] };
          })
        );
        toast.success("Đã thêm bình luận mới");
      }
    } catch (error) {
      toast.error("Không thể gửi bình luận");
    }
  };

  // trả lời bình luận
  const replyComment = async (postId: string, commentId: string, content: string) => {
    try {
      const response = await fetch(`${API_URL}/api/educations/${postId}/comments/${commentId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          userId: "ADMIN",
          userName: user?.name || "Admin DaNang Recycle",
          avatar: user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || "Admin"}`
        }),
      });
      const json = await response.json();
      if (json.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                ...p,
                comments: (p.comments || []).map((c: any) =>
                  (c.id === commentId || c._id === commentId) ? { ...c, replies: json.data } : c
                ),
              }
              : p
          )
        );
        toast.success("Phản hồi bình luận thành công");
      }
    } catch (error) {
      toast.error("Không thể gửi phản hồi");
    }
  };

  return (
    <EducationContext.Provider
      value={{ posts, loading, getPost, addPost, updatePost, deletePost, toggleLike, addComment, replyComment }}
    >
      {children}
    </EducationContext.Provider>
  );
}

export function useEducation() {
  const context = useContext(EducationContext);
  if (context === undefined) {
    throw new Error("useEducation must be used within an EducationProvider");
  }
  return context;
}