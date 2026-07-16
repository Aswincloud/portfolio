/**
 * @file BlogPost.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Single blog post page at /blog/:slug. Looks the post up in the
 *   registry, renders its Body, and falls back to a not-found state for an
 *   unknown slug. Sets the document title for the post.
 */

import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock } from 'lucide-react';
import { getPost } from '../../data/blog/index.jsx';

const formatDate = iso =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const BlogPost = () => {
  const { slug } = useParams();
  const post = getPost(slug);

  useEffect(() => {
    document.title = post ? `${post.title} — Aswin` : 'Post not found — Aswin';
    window.scrollTo(0, 0);
  }, [post]);

  if (!post) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center bg-ink px-4 text-center'>
        <p className='eyebrow mb-4'>404</p>
        <h1 className='text-3xl font-bold sm:text-4xl'>That post doesn&apos;t exist</h1>
        <p className='mt-3 text-slate-400'>The link may be broken or the post may have moved.</p>
        <Link
          to='/blog'
          viewTransition
          className='mt-8 inline-flex items-center gap-2 rounded-xl border border-hairline bg-surface px-5 py-3 font-medium text-slate-200 transition-colors hover:border-brand-500/40 hover:text-brand-200'
        >
          <ArrowLeft size={16} />
          All posts
        </Link>
      </div>
    );
  }

  const { Body } = post;

  return (
    <div className='min-h-screen bg-ink px-4 py-24 sm:px-6'>
      <article className='mx-auto max-w-3xl'>
        <Link
          to='/blog'
          viewTransition
          className='inline-flex items-center gap-2 font-mono text-sm text-slate-500 transition-colors hover:text-brand-300'
        >
          <ArrowLeft size={15} />
          All posts
        </Link>

        <header className='mt-8 border-b border-hairline pb-8'>
          <div className='flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-slate-500'>
            <span className='inline-flex items-center gap-1.5'>
              <CalendarDays size={13} />
              {formatDate(post.date)}
            </span>
            <span className='inline-flex items-center gap-1.5'>
              <Clock size={13} />
              {post.readingTime}
            </span>
          </div>
          <h1 className='mt-4 text-3xl font-bold leading-tight sm:text-4xl'>{post.title}</h1>
          <div className='mt-5 flex flex-wrap gap-2'>
            {post.tags.map(tag => (
              <span
                key={tag}
                className='rounded-md border border-hairline bg-surface-2 px-2.5 py-1 font-mono text-[11px] text-slate-400'
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        <div className='mt-2'>
          <Body />
        </div>

        <footer className='mt-16 border-t border-hairline pt-8'>
          <Link
            to='/blog'
            viewTransition
            className='inline-flex items-center gap-2 font-mono text-sm text-brand-300 transition-colors hover:text-brand-200'
          >
            <ArrowLeft size={15} />
            Back to all posts
          </Link>
        </footer>
      </article>
    </div>
  );
};

export default BlogPost;
