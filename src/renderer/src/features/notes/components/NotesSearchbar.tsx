// dependencies
import React from 'react'
import { useNotesStore } from '../store/notesStore'
import { Searchbar } from '@/components/shared'

const NotesSearchbar: React.FC = () => {
  const { searchQuery, setSearchQuery } = useNotesStore()

  return (
    <Searchbar
      placeholder="Search notes"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  )
}

export default NotesSearchbar
