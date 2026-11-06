export const FOLDERS = [
  { id: 'work', name: 'Work', icon: 'briefcase' },
  { id: 'personal', name: 'Personal', icon: 'folder' },
  { id: 'projects', name: 'Projects', icon: 'layers' },
  { id: 'school', name: 'School', icon: 'book' },
]

export const folderName = (id) => FOLDERS.find((folder) => folder.id === id)?.name ?? 'Unsorted'
