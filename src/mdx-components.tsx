'use client';

import * as React from 'react';
import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => <h1 className="text-3xl md:text-4xl font-semibold mb-4" {...props} />,
    h2: (props) => <h2 className="text-2xl md:text-3xl font-semibold mt-8 mb-3" {...props} />,
    h3: (props) => <h3 className="text-xl md:text-2xl font-semibold mt-6 mb-2" {...props} />,
    p:  (props) => <p className="text-white/80 leading-relaxed mb-4" {...props} />,
    a:  (props) => <a className="underline hover:text-white" {...props} />,
    ul: (props) => <ul className="list-disc pl-6 space-y-2 mb-4" {...props} />,
    ol: (props) => <ol className="list-decimal pl-6 space-y-2 mb-4" {...props} />,
    ...components,
  };
}


