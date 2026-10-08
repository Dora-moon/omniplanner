// src/controllers/usePosts.ts
// Controller hook managing Social Feed posts: creating with image upload, subscribing, and deleting.

import { useEffect, useState } from 'react';
import { toast } from '@/ui/Toast';
import {
  subscribeUserPosts,
  addPost,
  deletePost,
  uploadPostImage,
  updatePost,
} from '@/models/posts.model';
import type { Language, Post } from '@/types';

interface UsePostsArgs {
  uid: string;
  authorName: string;
  language: Language;
}

export function usePosts({ uid, authorName, language }: UsePostsArgs) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Form drafting state
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Post['visibility']>('public');

  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [postSuccessMsg, setPostSuccessMsg] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Subscribe to real-time posts
  useEffect(() => {
    if (!uid) {
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeUserPosts(uid, (list) => {
      setPosts(list);
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  // Clean up object URL when image changes or unmounts
  useEffect(() => {
    if (!selectedImage) {
      setImagePreview(null);
      return;
    }
    const previewUrl = URL.createObjectURL(selectedImage);
    setImagePreview(previewUrl);
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [selectedImage]);

  function handleImageSelect(file: File) {
    setPostError('');
    // Compression happens server-side (uploadPostImage); reject absurdly large
    // raw files here to avoid freezing the browser on the canvas draw.
    if (file.size > 30 * 1024 * 1024) {
      setPostError(
        language === 'vi'
          ? 'Ảnh quá lớn (vượt 30MB).'
          : 'Image is too large (over 30MB).'
      );
      return;
    }
    setSelectedImage(file);
  }

  function handleRemoveImage() {
    setSelectedImage(null);
    setImagePreview(null);
  }

  async function handleCreatePost(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed && !selectedImage) {
      setPostError(
        language === 'vi'
          ? 'Vui lòng nhập nội dung hoặc chọn ảnh.'
          : 'Please enter content or attach an image.'
      );
      return;
    }

    setPosting(true);
    setPostError('');
    setPostSuccessMsg('');

    try {
      let imageUrl: string | null = null;
      if (selectedImage) {
        // uploadPostImage compresses the image to a max side of 800px and
        // returns a base64 data URL (no Storage).
        imageUrl = await uploadPostImage(uid, selectedImage);
      }

      await addPost(uid, authorName, {
        content: trimmed,
        imageUrl,
        visibility,
      });

      setContent('');
      setSelectedImage(null);
      setImagePreview(null);
      setPostSuccessMsg(
        language === 'vi' ? 'Đã đăng bài viết mới!' : 'Post published!'
      );
      toast.success(
        language === 'vi' ? 'Đã đăng bài viết mới!' : 'Post published!'
      );
      setTimeout(() => setPostSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error('Failed to create post:', err);
      const code = err?.code || 'post-failed';
      setPostError(
        err.message ||
          (language === 'vi'
            ? 'Không thể đăng bài viết lúc này.'
            : 'Failed to create post.')
      );
      toast.error(
        err.message ||
          (language === 'vi'
            ? 'Không thể đăng bài viết lúc này.'
            : 'Failed to create post.'),
        code
      );
    } finally {
      setPosting(false);
    }
  }

  async function handleDeletePost(postId: string) {
    setDeletingId(postId);
    try {
      await deletePost(uid, postId);
    } catch (err: any) {
      console.error('Failed to delete post:', err);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleUpdateVisibility(
    postId: string,
    nextVisibility: Post['visibility']
  ) {
    try {
      await updatePost(uid, postId, { visibility: nextVisibility });
    } catch (err) {
      console.error('Failed to update visibility:', err);
    }
  }

  return {
    posts,
    loading,
    content,
    setContent,
    selectedImage,
    imagePreview,
    handleImageSelect,
    handleRemoveImage,
    visibility,
    setVisibility,
    posting,
    postError,
    postSuccessMsg,
    deletingId,
    handleCreatePost,
    handleDeletePost,
    handleUpdateVisibility,
  };
}
