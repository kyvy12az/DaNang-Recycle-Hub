import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, MessageCircle, Leaf, Droplets, Coins, Clock, Pencil, Trash2, Send, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useEducation } from "@/contexts/EducationContext";

const catLabels: Record<string, string> = { recycling: "Tái chế", saving: "Tiết kiệm", environment: "Môi trường" };

export default function EducationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPost, toggleLike, deletePost, replyComment, addComment } = useEducation();
  const post = id ? getPost(id) : undefined;

  const [commentOpen, setCommentOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  if (!post) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Button variant="outline" size="sm" onClick={() => navigate("/education")}>
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>
        <p className="text-muted-foreground">Không tìm thấy bài viết.</p>
      </div>
    );
  }

  const commentCount = (post.comments || []).reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);

  const handleDelete = () => {
    deletePost(post.id);
    toast.success("Đã xóa bài viết");
    navigate("/education");
  };

  const handleReply = (commentId: string) => {
    if (!replyText.trim()) return;
    replyComment(post.id, commentId, replyText);
    setReplyText("");
    setReplyingTo(null);
    toast.success("Đã gửi trả lời");
  };

  const handleAddComment = () => {
    if (!replyText.trim()) return;
    addComment(post.id, replyText);
    setReplyText("");
    setReplyingTo(null);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => navigate("/education")}>
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => navigate(`/education/${post.id}/edit`)}>
          <Pencil className="h-4 w-4 mr-1.5" /> Chỉnh sửa
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-1.5" /> Xóa
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa bài viết?</AlertDialogTitle>
              <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Xóa</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card className="overflow-hidden">
        <div className="aspect-video bg-muted flex items-center justify-center">
          {post.coverImage ? (
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-muted-foreground">
              <ImageOff className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Chưa có ảnh bìa</p>
            </div>
          )}
        </div>
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{catLabels[post.category]}</Badge>
            <StatusBadge status={post.status} />
            {post.featured && <Badge variant="secondary">⭐ Nổi bật</Badge>}
            <span className="text-xs text-muted-foreground ml-auto">
              {new Date(post.createdAt).toLocaleDateString("vi-VN")}
            </span>
          </div>

          <h1 className="text-2xl font-bold">{post.title}</h1>
          <p className="text-muted-foreground">{post.description}</p>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { toggleLike(post.id); toast.success("Đã thích"); }}>
              <Heart className="h-4 w-4 mr-1.5 text-red-500" />
              {post.likes || 0} lượt thích
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCommentOpen(true)}>
              <MessageCircle className="h-4 w-4 mr-1.5" />
              {commentCount} bình luận
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat icon={<Leaf className="h-4 w-4" />} label="CO₂ giảm" value={`${post.co2SavedKg || 0} kg`} />
            <Stat icon={<Droplets className="h-4 w-4" />} label="Nước tiết kiệm" value={`${post.waterSavedL || 0} L`} />
            <Stat icon={<Coins className="h-4 w-4" />} label="Điểm xanh" value={`+${post.greenPoints || 0}`} />
            <Stat icon={<Clock className="h-4 w-4" />} label="Đọc" value={`${post.readMinutes || 0} phút`} />
          </div>

          {post.readMinutesForPoints ? (
            <p className="text-xs text-muted-foreground">
              💡 Đọc tối thiểu {post.readMinutesForPoints} phút để được cộng {post.greenPoints} điểm xanh.
            </p>
          ) : null}

          <div className="border-t pt-4">
            <h2 className="font-semibold mb-2">Nội dung</h2>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground/90">
              {post.content || "Chưa có nội dung."}
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet open={commentOpen} onOpenChange={setCommentOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle>Bình luận ({commentCount})</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-auto mt-4 space-y-4 pr-1">
            {(post.comments || []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Chưa có bình luận nào.</p>
            )}
            {(post.comments || []).map((c: any) => {
              const cId = c._id || c.id;
              return (
              <div key={cId} className="space-y-2">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={c.avatar} />
                    <AvatarFallback>{c.userName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        {c.userName}
                        {c.userId === "ADMIN" && <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-blue-100 text-blue-800 hover:bg-blue-200">Admin</Badge>}
                      </p>
                      <p className="text-sm">{c.content}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{new Date(c.createdAt).toLocaleDateString("vi-VN")}</span>
                      <button className="hover:text-foreground font-medium" onClick={() => { setReplyingTo(replyingTo === cId ? null : cId); setReplyText(""); }}>
                        Trả lời
                      </button>
                    </div>
                  </div>
                </div>

                {(c.replies || []).map((r: any) => {
                  const rId = r._id || r.id;
                  return (
                  <div key={rId} className="flex gap-3 pl-11">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={r.avatar} />
                      <AvatarFallback>A</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="bg-primary/10 rounded-lg px-3 py-2">
                        <p className="text-xs font-medium flex items-center gap-1.5">
                          {r.userName}
                          {r.userId === "ADMIN" && <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-blue-100 text-blue-800 hover:bg-blue-200">Admin</Badge>}
                        </p>
                        <p className="text-sm">{r.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>
                )})}

                {replyingTo === cId && (
                  <div className="pl-11 flex gap-2">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Trả lời của admin..."
                      rows={2}
                      className="text-sm"
                    />
                    <Button size="icon" className="shrink-0" onClick={() => handleReply(cId)}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )})}
          </div>

          <div className="border-t pt-4 pb-2 mt-auto">
            {replyingTo === 'new_comment' ? (
              <div className="flex gap-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Bình luận dưới tư cách Admin..."
                  rows={2}
                  className="text-sm"
                />
                <Button size="icon" className="shrink-0" onClick={handleAddComment}>
                  <Send className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="shrink-0" onClick={() => { setReplyingTo(null); setReplyText(""); }}>
                  X
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="w-full border border-green-500 text-white bg-primary" onClick={() => { setReplyingTo('new_comment'); setReplyText(""); }}>
                Thêm bình luận
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3 bg-muted/30">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {icon}{label}
      </div>
      <p className="font-semibold">{value}</p>
    </div>
  );
}