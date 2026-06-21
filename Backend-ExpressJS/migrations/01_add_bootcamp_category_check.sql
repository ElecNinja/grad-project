ALTER TABLE public.bootcamps
ADD CONSTRAINT bootcamps_category_check
CHECK (
  category = ANY (
    ARRAY[
      'cyber-security',
      'artificial-intelligence',
      'web-development',
      'mobile-development',
      'data-science',
      'cloud-computing',
      'mathematics',
      'business',
      'language-learning',
      'design',
      'other'
    ]::text[]
  )
);
