/**
 * @file BlogIndex.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Blog listing page at /blog — a card per post, newest first.
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Clock } from 'lucide-react';
import { posts } from '../../data/blog/index.jsx';

const formatDate = iso =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const BlogIndex = () => {
  useEffect(() => {
    document.title = 'Blog — Aswin';
  }, []);

  return (
    <div className='min-h-screen bg-ink px-4 py-24 sm:px-6'>
      <div className='mx-auto max-w-3xl'>
        <Link
          to='/'
          viewTransition
          className='inline-flex items-center gap-2 font-mono text-sm text-slate-500 transition-colors hover:text-brand-300'
        >
          <ArrowLeft size={15} />
          Back home
        </Link>

        <header className='mt-8'>
          <p className='eyebrow mb-4'>Writing</p>
          <h1 className='text-4xl font-bold sm:text-5xl'>
            The <span className='gradient-text'>blog</span>
          </h1>
          <p className='mt-4 text-lg leading-relaxed text-slate-400'>
            Notes on what I build and how — performance, the web, and running my own cloud.
          </p>
        </header>

        <ul className='mt-12 space-y-5'>
          {posts.map(post => (
            <li key={post.slug}>
              <Link
                to={`/blog/${post.slug}`}
                viewTransition
                className='group block card-surface p-6 transition-colors duration-300 hover:border-brand-500/30 hover:bg-surface-2 sm:p-7'
              >
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

                <h2 className='mt-3 text-xl font-bold text-white transition-colors group-hover:text-brand-200 sm:text-2xl'>
                  {post.title}
                </h2>
                <p className='mt-2 leading-relaxed text-slate-400'>{post.description}</p>

                <div className='mt-4 flex flex-wrap items-center justify-between gap-3'>
                  <div className='flex flex-wrap gap-2'>
                    {post.tags.map(tag => (
                      <span
                        key={tag}
                        className='rounded-md border border-hairline bg-surface-2 px-2.5 py-1 font-mono text-[11px] text-slate-400'
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className='inline-flex items-center gap-1.5 font-mono text-sm text-brand-300'>
                    Read
                    <ArrowRight
                      size={15}
                      className='transition-transform duration-200 group-hover:translate-x-0.5'
                    />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default BlogIndex;
