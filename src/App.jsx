import { useEffect } from 'react'
import AppShell from './components/AppShell.jsx'
import Toast from './components/Toast.jsx'
import { useLibrary } from './hooks/useLibrary.js'
import { useRoute } from './hooks/useRoute.js'
import { navigate } from './lib/router.js'
import DomeIntro from './pages/DomeIntro.jsx'
import EditorPage from './pages/EditorPage.jsx'
import PresentPage from './pages/PresentPage.jsx'
import SkyPage from './pages/SkyPage.jsx'

const SKY_VIEWS = new Set(['home', 'recent', 'shared', 'starred', 'trash', 'folder'])

const App = () => {
  const route = useRoute()
  const { settings } = useLibrary()
  const showIntro = route.name === 'intro' || (route.name === 'start' && settings.showIntro)

  // Launching with the intro turned off goes straight to the sky.
  useEffect(() => {
    if (route.name === 'start' && !settings.showIntro) navigate('/home', { replace: true })
    if (route.name === 'notFound') navigate('/home', { replace: true })
  }, [route.name, settings.showIntro])

  let page = null
  if (showIntro) page = <DomeIntro />
  else if (route.name === 'deck') page = <EditorPage id={route.params.id} />
  else if (route.name === 'present') page = <PresentPage id={route.params.id} slide={route.params.slide} />
  else if (SKY_VIEWS.has(route.name)) {
    page = (
      <AppShell currentPath={route.path}>
        {(query) => <SkyPage view={route.name} folderId={route.params?.folder} query={query} />}
      </AppShell>
    )
  }

  return (
    <>
      {page}
      <Toast />
    </>
  )
}

export default App
