import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { Highlight } from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  Link as LinkIcon, Image as ImageIcon, List, ListOrdered,
  Quote, Table as TableIcon, AlignLeft, AlignCenter, AlignRight,
  Highlighter, Type, Heading1, Heading2, Heading3, Undo, Redo,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-accent underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-border my-4',
          style: 'width: auto; min-width: 50%;',
        },
      }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border p-3 min-w-[100px]',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-border p-3 bg-secondary font-bold min-w-[100px]',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'listItem', 'blockquote', 'tableCell', 'tableHeader'],
        alignments: ['left', 'center', 'right'],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const addLink = () => {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const openImageModal = () => {
    setImageUrl('');
    setImageCaption('');
    setShowImageModal(true);
  };

  const insertImage = () => {
    if (!imageUrl) return;
    
    if (imageCaption) {
      editor.chain().focus().insertContent(`
        <figure>
          <img src="${imageUrl}" alt="${imageCaption}" />
          <figcaption>${imageCaption}</figcaption>
        </figure>
      `).run();
    } else {
      editor.chain().focus().setImage({ src: imageUrl }).run();
    }
    
    setShowImageModal(false);
    setImageUrl('');
    setImageCaption('');
  };

  const setColor = () => {
    const color = window.prompt('Enter color (hex or name):', '#000000');
    if (color) {
      editor.chain().focus().setColor(color).run();
    }
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const ToolbarButton = ({ 
    onClick, 
    active = false, 
    children, 
    title 
  }: { 
    onClick: () => void; 
    active?: boolean; 
    children: React.ReactNode; 
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded hover:bg-secondary transition-colors ${active ? 'bg-secondary text-accent' : ''}`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-border rounded-lg overflow-hidden relative">
      {/* Image URL Modal */}
      {showImageModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-primary mb-4">Insert Image</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-primary block mb-2">
                  Image URL *
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-secondary/30 border border-border p-3 focus:outline-none focus:ring-2 focus:ring-accent"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-primary block mb-2">
                  Caption (optional)
                </label>
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="Describe the image..."
                  className="w-full bg-secondary/30 border border-border p-3 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowImageModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={insertImage}
                  disabled={!imageUrl}
                  className="flex-1 bg-accent hover:bg-accent/90"
                >
                  Insert
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-secondary/30 border-b border-border">
        {/* History */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo size={18} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo size={18} />
        </ToolbarButton>
        
        <div className="w-px h-6 bg-border mx-1 self-center" />
        
        {/* Headings */}
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 size={18} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={18} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 size={18} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().setParagraph().run()} 
          active={editor.isActive('paragraph')}
          title="Paragraph"
        >
          <Type size={18} />
        </ToolbarButton>
        
        <div className="w-px h-6 bg-border mx-1 self-center" />
        
        {/* Text formatting */}
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleBold().run()} 
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold size={18} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleItalic().run()} 
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic size={18} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleUnderline().run()} 
          active={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon size={18} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleStrike().run()} 
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough size={18} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleHighlight().run()} 
          active={editor.isActive('highlight')}
          title="Highlight"
        >
          <Highlighter size={18} />
        </ToolbarButton>
        <ToolbarButton onClick={setColor} title="Text Color">
          <div className="w-4 h-4 rounded border border-border bg-gradient-to-r from-red-500 via-green-500 to-blue-500" />
        </ToolbarButton>
        
        <div className="w-px h-6 bg-border mx-1 self-center" />
        
        {/* Alignment */}
        <ToolbarButton 
          onClick={() => editor.chain().focus().setTextAlign('left').run()} 
          active={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft size={18} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().setTextAlign('center').run()} 
          active={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter size={18} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().setTextAlign('right').run()} 
          active={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight size={18} />
        </ToolbarButton>
        
        <div className="w-px h-6 bg-border mx-1 self-center" />
        
        {/* Lists */}
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleBulletList().run()} 
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List size={18} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleOrderedList().run()} 
          active={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered size={18} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleBlockquote().run()} 
          active={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote size={18} />
        </ToolbarButton>
        
        <div className="w-px h-6 bg-border mx-1 self-center" />
        
        {/* Insert */}
        <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="Add Link">
          <LinkIcon size={18} />
        </ToolbarButton>
        <ToolbarButton onClick={openImageModal} title="Insert Image">
          <ImageIcon size={18} />
        </ToolbarButton>
        <ToolbarButton onClick={addTable} title="Insert Table">
          <TableIcon size={18} />
        </ToolbarButton>
        
        {editor.isActive('table') && (
          <>
            <div className="w-px h-6 bg-border mx-1 self-center" />
            <ToolbarButton 
              onClick={() => editor.chain().focus().addColumnAfter().run()} 
              title="Add Column"
            >
              <span className="text-xs">+Col</span>
            </ToolbarButton>
            <ToolbarButton 
              onClick={() => editor.chain().focus().addRowAfter().run()} 
              title="Add Row"
            >
              <span className="text-xs">+Row</span>
            </ToolbarButton>
            <ToolbarButton 
              onClick={() => editor.chain().focus().deleteTable().run()} 
              title="Delete Table"
            >
              <Trash2 size={18} className="text-destructive" />
            </ToolbarButton>
          </>
        )}
      </div>
      
      {/* Editor */}
      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none p-4 min-h-[400px] focus:outline-none 
          [&_.ProseMirror]:min-h-[380px] [&_.ProseMirror]:outline-none 
          [&_.ProseMirror_p]:my-2 
          [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:my-4 
          [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:my-3 
          [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:my-2 
          [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-accent [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:my-4 [&_.ProseMirror_blockquote]:bg-secondary/30 [&_.ProseMirror_blockquote]:py-2 [&_.ProseMirror_blockquote]:pr-4
          [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 
          [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6
          [&_.ProseMirror_li]:my-1
          [&_.ProseMirror_figure]:my-4
          [&_.ProseMirror_figcaption]:text-center [&_.ProseMirror_figcaption]:text-sm [&_.ProseMirror_figcaption]:text-muted-foreground [&_.ProseMirror_figcaption]:mt-2 [&_.ProseMirror_figcaption]:italic"
      />
    </div>
  );
}
