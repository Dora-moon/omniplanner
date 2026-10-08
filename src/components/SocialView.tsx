// src/components/SocialView.tsx
// Social Feed View (Requirement 6): Create post with image upload and view author's post timeline.

import React from 'react';
import { useTranslation } from '@/i18n/translations';
import { usePosts } from '@/controllers/usePosts';
import { Button, Card, Badge } from '@/ui';
import type { Language, Post, UserProfile } from '@/types';
import {
  Share2,
  Image as ImageIcon,
  Send,
  Trash2,
  Globe,
  Users,
  Lock,
  Calendar,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface SocialViewProps {
  uid: string;
  profile: UserProfile;
  language: Language;
}

export default function SocialView({ uid, profile, language }: SocialViewProps) {
  const { t } = useTranslation(language);
  const authorName = profile.displayName || 'Alex';
  const authorAvatar = profile.mascotUrl || profile.profileData?.avatarUrl || null;

  const {
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
  } = usePosts({ uid, authorName, language });

  function renderVisibilityIcon(vis: Post['visibility']) {
    switch (vis) {
      case 'public':
        return <Globe size={13} className="text-emerald-500" />;
      case 'friends':
        return <Users size={13} className="text-cyan-500" />;
      case 'private':
        return <Lock size={13} className="text-amber-500" />;
      default:
        return null;
    }
  }

  function getVisibilityLabel(vis: Post['visibility']) {
    switch (vis) {
      case 'public':
        return t('socialPublic');
      case 'friends':
        return t('socialFriends');
      case 'private':
        return t('socialPrivate');
      default:
        return vis;
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="pb-3 border-b border-[var(--line)]">
        <h1 className="text-2xl font-serif font-bold text-[var(--text)]">
          {t('socialTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-dim)] mt-0.5">
          {t('socialSubtitle')}
        </p>
      </div>

      {/* 1. CREATE POST FORM */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          {/* User Avatar */}
          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-[var(--panel-2)] border border-[var(--line)] flex-shrink-0 flex items-center justify-center">
            {authorAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={authorAvatar}
                alt="Author"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-bold text-sm text-[var(--accent)]">
                {authorName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Form input */}
          <div className="flex-1 space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder={t('socialPlaceholder')}
              className="w-full px-4 py-3 rounded-2xl bg-[var(--panel-2)] border border-[var(--line)] text-xs sm:text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all resize-none"
            />

            {/* Selected Image Preview */}
            {imagePreview && (
              <div className="relative rounded-2xl overflow-hidden border border-[var(--line)] max-h-72 bg-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Post preview"
                  className="w-full h-full max-h-72 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* Form actions: Upload image, Visibility & Post button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[var(--line)]/50">
              <div className="flex items-center gap-2">
                {/* Image upload trigger */}
                <label
                  htmlFor="post-image-file"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] hover:border-[var(--accent)] text-xs font-medium text-[var(--text)] cursor-pointer transition-all"
                >
                  <ImageIcon size={15} className="text-[var(--accent)]" />
                  <span>{t('socialAttachPhoto')}</span>
                </label>
                <input
                  id="post-image-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect(file);
                  }}
                />

                {/* Visibility Selector */}
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as Post['visibility'])}
                  className="px-2.5 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] text-xs font-medium text-[var(--text)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                >
                  <option value="public">{t('socialPublic')}</option>
                  <option value="friends">{t('socialFriends')}</option>
                  <option value="private">{t('socialPrivate')}</option>
                </select>
              </div>

              <Button
                type="button"
                variant="primary"
                size="sm"
                loading={posting}
                disabled={posting || (!content.trim() && !selectedImage)}
                onClick={() => handleCreatePost()}
                leftIcon={<Send size={14} />}
              >
                {posting ? t('socialPosting') : t('socialPostBtn')}
              </Button>
            </div>

            {/* Feedback messages */}
            {postError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium">
                <AlertCircle size={14} />
                <span>{postError}</span>
              </div>
            )}
            {postSuccessMsg && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <CheckCircle2 size={14} />
                <span>{postSuccessMsg}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 2. POSTS TIMELINE */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--text-dim)]">
            <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p>{t('loading')}</p>
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--panel-2)] flex items-center justify-center mx-auto text-[var(--accent)] border border-[var(--line)]">
              <Share2 size={22} />
            </div>
            <p className="text-sm font-semibold text-[var(--text)]">
              {t('socialNoPosts')}
            </p>
          </Card>
        ) : (
          posts.map((post) => {
            const dateStr = new Date(post.createdAt).toLocaleDateString(
              language === 'vi' ? 'vi-VN' : 'en-US',
              {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }
            );

            return (
              <Card key={post.id} className="p-5 sm:p-6 space-y-3.5">
                {/* Author row & visibility */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-[var(--panel-2)] border border-[var(--line)] flex items-center justify-center flex-shrink-0">
                      {authorAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={authorAvatar}
                          alt={post.authorName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-bold text-xs text-[var(--accent)]">
                          {post.authorName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[var(--text)] leading-tight">
                        {post.authorName}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--text-dim)] mt-0.5">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar size={11} />
                          {dateStr}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          {renderVisibilityIcon(post.visibility)}
                          <span>{getVisibilityLabel(post.visibility)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    title={t('socialDeletePost')}
                    disabled={deletingId === post.id}
                    onClick={() => {
                      if (window.confirm(t('socialConfirmDelete'))) {
                        handleDeletePost(post.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Post content */}
                {post.content && (
                  <p className="text-xs sm:text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </p>
                )}

                {/* Attached image */}
                {post.imageUrl && (
                  <div className="rounded-2xl overflow-hidden border border-[var(--line)] max-h-96 bg-black/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.imageUrl}
                      alt="Post visual"
                      className="w-full h-full max-h-96 object-cover hover:scale-[1.01] transition-transform duration-300"
                    />
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
