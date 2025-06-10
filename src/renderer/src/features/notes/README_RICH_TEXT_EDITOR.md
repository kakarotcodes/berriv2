# Rich Text Editor Documentation

## Overview

The Notes application now includes a fully-featured rich text editor built with [Tiptap](https://tiptap.dev/), providing a professional writing experience with extensive formatting options.

## Features

### Text Formatting

- **Bold** (`Ctrl/Cmd + B`): Make text bold
- **Italic** (`Ctrl/Cmd + I`): Make text italic
- **Code** (`Ctrl/Cmd + E`): Inline code formatting

### Headings

- **Heading 1**: Large headings for main sections
- **Heading 2**: Medium headings for subsections
- **Blockquote**: Quote formatting with left border

### Lists

- **Bullet Lists**: Unordered lists with disc bullets
- **Task Lists**: Interactive checkboxes for todo items
  - Click checkboxes to toggle completion
  - Nested task lists supported

### Tables

Advanced table functionality with full management:

- **Insert Table**: Creates a 3x3 table with header row
- **Add Row Above/Below**: Insert new rows
- **Add Column Left/Right**: Insert new columns
- **Delete Row/Column**: Remove specific rows or columns
- **Delete Table**: Remove entire table
- **Resizable columns**: Drag column borders to resize

### Images

Two ways to add images:

1. **File Upload**: Select local image files (jpg, png, gif, etc.)
2. **URL**: Paste image URLs from the web

- Images are automatically resized to fit content width
- Responsive design maintains aspect ratio

## Usage

### Basic Editing

1. Select a note from the sidebar
2. Click in the editor area to start typing
3. Use the toolbar buttons for formatting
4. Changes are automatically saved every 300ms

### Keyboard Shortcuts

- `Ctrl/Cmd + B`: Bold
- `Ctrl/Cmd + I`: Italic
- `Ctrl/Cmd + E`: Code
- `Ctrl/Cmd + Shift + 1`: Heading 1
- `Ctrl/Cmd + Shift + 2`: Heading 2
- `Ctrl/Cmd + Shift + .`: Blockquote
- `Ctrl/Cmd + Shift + 8`: Bullet list
- `Ctrl/Cmd + Shift + 9`: Task list

### Table Management

1. Click the table icon in toolbar
2. Select "Insert Table" to create a new table
3. Click in a table cell, then use table options to:
   - Add/remove rows and columns
   - Navigate with Tab/Shift+Tab
   - Delete entire table when needed

### Image Insertion

1. Click the image icon in toolbar
2. Choose between:
   - **OK**: Upload local file (recommended for best performance)
   - **Cancel**: Enter image URL

## Technical Implementation

### Architecture

```
NotesEditor.tsx
├── Tiptap Editor Core
├── Extensions
│   ├── StarterKit (basic editing)
│   ├── Table (table functionality)
│   ├── TaskList/TaskItem (checkboxes)
│   ├── Image (image handling)
│   └── BulletList/ListItem (lists)
├── Toolbar Component
└── Custom Styles
```

### Key Dependencies

```json
{
  "@tiptap/react": "^2.12.0",
  "@tiptap/starter-kit": "^2.12.0",
  "@tiptap/extension-table": "^2.12.0",
  "@tiptap/extension-task-list": "^2.12.0",
  "@tiptap/extension-task-item": "^2.12.0",
  "@tiptap/extension-image": "^2.12.0",
  "@tiptap/extension-bullet-list": "^2.12.0",
  "@tiptap/extension-list-item": "^2.12.0"
}
```

### Data Storage

- Notes are stored as HTML strings in the database
- Auto-save triggers 300ms after user stops typing
- Title and content are saved separately
- All formatting is preserved across sessions

### Styling

- Dark theme optimized for the app's design
- Yellow accents for headings and active states
- Custom table styling with borders and hover effects
- Responsive image handling
- Clean, minimal toolbar design

## Best Practices

### Content Organization

- Use headings to structure long documents
- Task lists for actionables and todos
- Tables for structured data
- Images to enhance understanding

### Performance Tips

- For images, prefer file uploads over URLs when possible
- Large tables may impact editor performance
- Keep individual notes focused and reasonably sized

### Accessibility

- All toolbar buttons have descriptive titles
- Keyboard shortcuts follow standard conventions
- High contrast styling for better readability
- Semantic HTML structure maintained

## Customization

### Adding New Features

To extend the editor:

1. Install additional Tiptap extensions
2. Add to extensions array in `useEditor` configuration
3. Create toolbar buttons in the toolbar section
4. Add appropriate styling in the style block

### Styling Modifications

Custom styles are defined in the component's style block:

- `.ProseMirror` for general editor styling
- Specific element selectors for formatting
- Table-specific styles for layout and interaction
- Image styles for responsive behavior

## Troubleshooting

### Common Issues

1. **Images not loading**: Check URL accessibility or file format support
2. **Table formatting issues**: Ensure proper cell selection before operations
3. **Auto-save not working**: Verify note is selected and database connection

### Debug Mode

Enable console logging to see:

- Editor state changes
- Auto-save triggers
- Content serialization

## Future Enhancements

Potential additions:

- Code block syntax highlighting
- Collaborative editing
- Export to PDF/Word
- Advanced image editing
- Custom themes
- Plugin system for extensions
