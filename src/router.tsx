import React, { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';

const Landing = lazy(() => import('@/pages/Landing'));
const Write = lazy(() => import('@/pages/Write'));
const Sealed = lazy(() => import('@/pages/Sealed'));
const MyCorner = lazy(() => import('@/pages/MyCorner'));
const NoteDetail = lazy(() => import('@/pages/NoteDetail'));
const About = lazy(() => import('@/pages/About'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const DevFonts = lazy(() => import('@/pages/DevFonts'));
const DevShareCard = lazy(() => import('@/pages/DevShareCard'));
const DevSealedSuccess = lazy(() => import('@/pages/DevSealedSuccess'));

function withSuspense(Component: React.ComponentType) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-16" aria-live="polite">
          <p className="font-display text-2xl text-star-glow animate-pulse">
            Chờ vũ trụ một chút nha…
          </p>
        </div>
      }
    >
      <Component />
    </Suspense>
  );
}

const devAppRoutes = import.meta.env.DEV
  ? [
      {
        path: 'dev/fonts',
        element: withSuspense(DevFonts),
      },
      {
        path: 'dev/sealed-success',
        element: withSuspense(DevSealedSuccess),
      },
    ]
  : [];

const devStandaloneRoutes = import.meta.env.DEV
  ? [
      {
        path: 'dev/share-card',
        element: withSuspense(DevShareCard),
      },
    ]
  : [];

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PageShell />,
    children: [
      {
        index: true,
        element: withSuspense(Landing),
      },
      {
        path: 'viet',
        element: withSuspense(Write),
      },
      {
        path: 'viet/xong',
        element: withSuspense(Sealed),
      },
      {
        path: 'toi',
        element: withSuspense(MyCorner),
      },
      {
        path: 'note/:id',
        element: withSuspense(NoteDetail),
      },
      {
        path: 'gioi-thieu',
        element: withSuspense(About),
      },
      ...devAppRoutes,
      {
        path: '*',
        element: withSuspense(NotFound),
      },
    ],
  },
  ...devStandaloneRoutes,
]);

export default router;
