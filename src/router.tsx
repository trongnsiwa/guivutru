import React, { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';

const Landing = lazy(() => import('@/pages/Landing'));
const Write = lazy(() => import('@/pages/Write'));
const Sealed = lazy(() => import('@/pages/Sealed'));
const MyCorner = lazy(() => import('@/pages/MyCorner'));
const NoteDetail = lazy(() => import('@/pages/NoteDetail'));
const About = lazy(() => import('@/pages/About'));
const Sky = lazy(() => import('@/pages/Sky'));
const MySky = lazy(() => import('@/pages/Sky/MySky'));
const AdminReports = lazy(() => import('@/pages/Admin/Reports'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const DevFonts = lazy(() => import('@/pages/DevFonts'));
const DevShareCard = lazy(() => import('@/pages/DevShareCard'));
const DevSealedSuccess = lazy(() => import('@/pages/DevSealedSuccess'));
const DevYearInReviewCard = lazy(() => import('@/pages/DevYearInReviewCard'));
const DevAudioSealed = lazy(() => import('@/pages/DevAudioNotes').then(m => ({ default: m.DevNoteDetailSealed })));
const DevAudioOpened = lazy(() => import('@/pages/DevAudioNotes').then(m => ({ default: m.DevNoteDetailOpened })));

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
      {
        path: 'note/dev_audio_sealed',
        element: withSuspense(DevAudioSealed),
      },
      {
        path: 'note/dev_audio_opened',
        element: withSuspense(DevAudioOpened),
      },
      {
        path: 'dev/toast',
        element: withSuspense(lazy(() => import('@/pages/DevAudioNotes').then(m => ({ default: m.DevToastPreview })))),
      },
    ]
  : [];

const devStandaloneRoutes = import.meta.env.DEV
  ? [
      {
        path: 'dev/share-card',
        element: withSuspense(DevShareCard),
      },
      {
        path: 'dev/year-in-review-card',
        element: withSuspense(DevYearInReviewCard),
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
      {
        path: 'bau-troi',
        element: withSuspense(Sky),
      },
      {
        path: 'bau-troi/cua-toi',
        element: withSuspense(MySky),
      },
      {
        path: 'admin/bao-cao',
        element: withSuspense(AdminReports),
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
