import { createBrowserRouter } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Landing } from '@/pages/Landing';
import { Write } from '@/pages/Write';
import { Sealed } from '@/pages/Sealed';
import { MyCorner } from '@/pages/MyCorner';
import { NoteDetail } from '@/pages/NoteDetail';
import { About } from '@/pages/About';
import { NotFound } from '@/pages/NotFound';
import { DevFonts } from '@/pages/DevFonts';
import { DevShareCard } from '@/pages/DevShareCard';
import { DevSealedSuccess } from '@/pages/DevSealedSuccess';

const devAppRoutes = import.meta.env.DEV
  ? [
      {
        path: 'dev/fonts',
        element: <DevFonts />,
      },
      {
        path: 'dev/sealed-success',
        element: <DevSealedSuccess />,
      },
    ]
  : [];

const devStandaloneRoutes = import.meta.env.DEV
  ? [
      {
        path: 'dev/share-card',
        element: <DevShareCard />,
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
        element: <Landing />,
      },
      {
        path: 'viet',
        element: <Write />,
      },
      {
        path: 'viet/xong',
        element: <Sealed />,
      },
      {
        path: 'toi',
        element: <MyCorner />,
      },
      {
        path: 'note/:id',
        element: <NoteDetail />,
      },
      {
        path: 'gioi-thieu',
        element: <About />,
      },
      ...devAppRoutes,
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
  ...devStandaloneRoutes,
]);

export default router;
