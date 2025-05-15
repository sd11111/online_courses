import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import styles from '../styles/LessonEditor.module.css';

// Типы блоков содержимого урока
export enum ContentBlockType {
  TEXT = 'TEXT',
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
  EMBED = 'EMBED',
  FILE = 'FILE',
  QUIZ = 'QUIZ',
  CODE = 'CODE',
  ASSIGNMENT = 'ASSIGNMENT',
}

// Интерфейс для базового блока содержимого
export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  order: number;
  title?: string;
}

// Интерфейсы для различных типов блоков
export interface TextBlock extends ContentBlock {
  type: ContentBlockType.TEXT;
  content: string;
}

export interface VideoBlock extends ContentBlock {
  type: ContentBlockType.VIDEO;
  url: string;
  description?: string;
}

export interface ImageBlock extends ContentBlock {
  type: ContentBlockType.IMAGE;
  url: string;
  caption?: string;
}

export interface EmbedBlock extends ContentBlock {
  type: ContentBlockType.EMBED;
  embedCode: string;
  description?: string;
}

export interface FileBlock extends ContentBlock {
  type: ContentBlockType.FILE;
  url: string;
  fileName: string;
  fileSize?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
}

export interface QuizBlock extends ContentBlock {
  type: ContentBlockType.QUIZ;
  questions: QuizQuestion[];
}

export interface CodeBlock extends ContentBlock {
  type: ContentBlockType.CODE;
  code: string;
  language: string;
}

export interface AssignmentBlock extends ContentBlock {
  type: ContentBlockType.ASSIGNMENT;
  instructions: string;
  dueDate?: string;
  points?: number;
}

// Объединение всех возможных типов блоков
export type AnyContentBlock =
  | TextBlock
  | VideoBlock
  | ImageBlock
  | EmbedBlock
  | FileBlock
  | QuizBlock
  | CodeBlock
  | AssignmentBlock;

// Свойства компонента редактора урока
interface LessonEditorProps {
  initialBlocks?: AnyContentBlock[];
  onChange?: (blocks: AnyContentBlock[]) => void;
  readOnly?: boolean;
}

const LessonEditor: React.FC<LessonEditorProps> = ({
  initialBlocks = [],
  onChange,
  readOnly = false,
}) => {
  const [blocks, setBlocks] = useState<AnyContentBlock[]>(initialBlocks);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [draggedBlockType, setDraggedBlockType] = useState<ContentBlockType | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Эффект для вызова onChange при изменении блоков
  useEffect(() => {
    if (onChange) {
      onChange(blocks);
    }
  }, [blocks, onChange]);

  // Функция для создания нового блока выбранного типа
  const createNewBlock = (type: ContentBlockType): AnyContentBlock => {
    const order = blocks.length > 0 ? Math.max(...blocks.map(block => block.order)) + 1 : 0;
    const id = uuidv4();

    switch (type) {
      case ContentBlockType.TEXT:
        return {
          id,
          type,
          order,
          title: 'Текстовый блок',
          content: '',
        } as TextBlock;

      case ContentBlockType.VIDEO:
        return {
          id,
          type,
          order,
          title: 'Видео',
          url: '',
          description: '',
        } as VideoBlock;

      case ContentBlockType.IMAGE:
        return {
          id,
          type,
          order,
          title: 'Изображение',
          url: '',
          caption: '',
        } as ImageBlock;

      case ContentBlockType.EMBED:
        return {
          id,
          type,
          order,
          title: 'Встраиваемый контент',
          embedCode: '',
          description: '',
        } as EmbedBlock;

      case ContentBlockType.FILE:
        return {
          id,
          type,
          order,
          title: 'Файл',
          url: '',
          fileName: '',
        } as FileBlock;

      case ContentBlockType.QUIZ:
        return {
          id,
          type,
          order,
          title: 'Тест',
          questions: [],
        } as QuizBlock;

      case ContentBlockType.CODE:
        return {
          id,
          type,
          order,
          title: 'Код',
          code: '',
          language: 'javascript',
        } as CodeBlock;

      case ContentBlockType.ASSIGNMENT:
        return {
          id,
          type,
          order,
          title: 'Задание',
          instructions: '',
        } as AssignmentBlock;

      default:
        return {
          id,
          type: ContentBlockType.TEXT,
          order,
          title: 'Новый блок',
          content: '',
        } as TextBlock;
    }
  };

  // Функция добавления нового блока
  const addBlock = (type: ContentBlockType) => {
    const newBlock = createNewBlock(type);
    const updatedBlocks = [...blocks, newBlock];
    setBlocks(updatedBlocks);
    setActiveBlockId(newBlock.id);
  };

  // Функция удаления блока по ID
  const removeBlock = (id: string) => {
    const updatedBlocks = blocks.filter(block => block.id !== id);
    // Переупорядочиваем блоки
    const reorderedBlocks = updatedBlocks.map((block, index) => ({
      ...block,
      order: index,
    }));
    setBlocks(reorderedBlocks);
    
    if (activeBlockId === id) {
      setActiveBlockId(null);
    }
  };

  // Функция обновления содержимого блока
  const updateBlock = (updatedBlock: AnyContentBlock) => {
    const updatedBlocks = blocks.map(block => 
      block.id === updatedBlock.id ? updatedBlock : block
    );
    setBlocks(updatedBlocks);
  };

  // Функция перемещения блока
  const moveBlock = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const updatedBlocks = [...blocks];
    const [movedBlock] = updatedBlocks.splice(fromIndex, 1);
    updatedBlocks.splice(toIndex, 0, movedBlock);

    // Переупорядочиваем блоки
    const reorderedBlocks = updatedBlocks.map((block, index) => ({
      ...block,
      order: index,
    }));

    setBlocks(reorderedBlocks);
  };

  // Обработчики для drag-and-drop
  const handleDragStart = (e: React.DragEvent, blockType: ContentBlockType | null, blockId?: string) => {
    if (blockType) {
      setDraggedBlockType(blockType);
    }
    if (blockId) {
      setDraggedBlockId(blockId);
    }
  };

  const handleDragEnd = () => {
    setDraggedBlockType(null);
    setDraggedBlockId(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    // Если перетаскиваем новый тип блока из панели инструментов
    if (draggedBlockType && !draggedBlockId) {
      const newBlock = createNewBlock(draggedBlockType);
      const updatedBlocks = [...blocks];
      updatedBlocks.splice(index, 0, newBlock);
      
      // Переупорядочиваем блоки
      const reorderedBlocks = updatedBlocks.map((block, idx) => ({
        ...block,
        order: idx,
      }));
      
      setBlocks(reorderedBlocks);
      setActiveBlockId(newBlock.id);
    } 
    // Если перетаскиваем существующий блок
    else if (draggedBlockId) {
      const fromIndex = blocks.findIndex(block => block.id === draggedBlockId);
      if (fromIndex !== -1) {
        moveBlock(fromIndex, index);
      }
    }
    
    handleDragEnd();
  };

  // Получить иконку для типа блока
  const getBlockIcon = (type: ContentBlockType): string => {
    switch (type) {
      case ContentBlockType.TEXT:
        return '📝';
      case ContentBlockType.VIDEO:
        return '🎬';
      case ContentBlockType.IMAGE:
        return '🖼️';
      case ContentBlockType.EMBED:
        return '🔗';
      case ContentBlockType.FILE:
        return '📄';
      case ContentBlockType.QUIZ:
        return '❓';
      case ContentBlockType.CODE:
        return '💻';
      case ContentBlockType.ASSIGNMENT:
        return '📋';
      default:
        return '📄';
    }
  };

  // Получить название для типа блока
  const getBlockTypeName = (type: ContentBlockType): string => {
    switch (type) {
      case ContentBlockType.TEXT:
        return 'Текст';
      case ContentBlockType.VIDEO:
        return 'Видео';
      case ContentBlockType.IMAGE:
        return 'Изображение';
      case ContentBlockType.EMBED:
        return 'Встраиваемый контент';
      case ContentBlockType.FILE:
        return 'Файл';
      case ContentBlockType.QUIZ:
        return 'Тест';
      case ContentBlockType.CODE:
        return 'Код';
      case ContentBlockType.ASSIGNMENT:
        return 'Задание';
      default:
        return 'Блок';
    }
  };

  // Компонент для редактирования текстового блока
  const TextBlockEditor = ({ block }: { block: TextBlock }) => {
    return (
      <div className={styles.blockEditor}>
        <input
          type="text"
          className={styles.blockTitle}
          value={block.title || ''}
          onChange={(e) => updateBlock({ ...block, title: e.target.value })}
          placeholder="Заголовок блока"
        />
        <textarea
          className={styles.textContent}
          value={block.content}
          onChange={(e) => updateBlock({ ...block, content: e.target.value })}
          placeholder="Введите текст..."
          rows={8}
        />
      </div>
    );
  };

  // Компонент для редактирования видео-блока
  const VideoBlockEditor = ({ block }: { block: VideoBlock }) => {
    return (
      <div className={styles.blockEditor}>
        <input
          type="text"
          className={styles.blockTitle}
          value={block.title || ''}
          onChange={(e) => updateBlock({ ...block, title: e.target.value })}
          placeholder="Заголовок видео"
        />
        <input
          type="text"
          className={styles.urlInput}
          value={block.url}
          onChange={(e) => updateBlock({ ...block, url: e.target.value })}
          placeholder="URL видео (YouTube, Vimeo, и т.д.)"
        />
        {block.url && (
          <div className={styles.videoPreview}>
            <iframe
              src={block.url}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={block.title || 'Видео'}
            />
          </div>
        )}
        <textarea
          className={styles.description}
          value={block.description || ''}
          onChange={(e) => updateBlock({ ...block, description: e.target.value })}
          placeholder="Описание видео"
          rows={3}
        />
      </div>
    );
  };

  // Компонент для редактирования блока изображения
  const ImageBlockEditor = ({ block }: { block: ImageBlock }) => {
    return (
      <div className={styles.blockEditor}>
        <input
          type="text"
          className={styles.blockTitle}
          value={block.title || ''}
          onChange={(e) => updateBlock({ ...block, title: e.target.value })}
          placeholder="Заголовок изображения"
        />
        <input
          type="text"
          className={styles.urlInput}
          value={block.url}
          onChange={(e) => updateBlock({ ...block, url: e.target.value })}
          placeholder="URL изображения"
        />
        {block.url && (
          <div className={styles.imagePreview}>
            <img src={block.url} alt={block.title || 'Изображение'} />
          </div>
        )}
        <input
          type="text"
          className={styles.caption}
          value={block.caption || ''}
          onChange={(e) => updateBlock({ ...block, caption: e.target.value })}
          placeholder="Подпись к изображению"
        />
      </div>
    );
  };

  // Компонент для редактирования блока встраиваемого контента
  const EmbedBlockEditor = ({ block }: { block: EmbedBlock }) => {
    return (
      <div className={styles.blockEditor}>
        <input
          type="text"
          className={styles.blockTitle}
          value={block.title || ''}
          onChange={(e) => updateBlock({ ...block, title: e.target.value })}
          placeholder="Заголовок блока"
        />
        <textarea
          className={styles.embedCode}
          value={block.embedCode}
          onChange={(e) => updateBlock({ ...block, embedCode: e.target.value })}
          placeholder="HTML-код для встраивания"
          rows={5}
        />
        <textarea
          className={styles.description}
          value={block.description || ''}
          onChange={(e) => updateBlock({ ...block, description: e.target.value })}
          placeholder="Описание"
          rows={3}
        />
      </div>
    );
  };

  // Компонент для редактирования блока файла
  const FileBlockEditor = ({ block }: { block: FileBlock }) => {
    return (
      <div className={styles.blockEditor}>
        <input
          type="text"
          className={styles.blockTitle}
          value={block.title || ''}
          onChange={(e) => updateBlock({ ...block, title: e.target.value })}
          placeholder="Заголовок файла"
        />
        <input
          type="text"
          className={styles.urlInput}
          value={block.url}
          onChange={(e) => updateBlock({ ...block, url: e.target.value })}
          placeholder="URL файла"
        />
        <input
          type="text"
          className={styles.fileName}
          value={block.fileName}
          onChange={(e) => updateBlock({ ...block, fileName: e.target.value })}
          placeholder="Имя файла"
        />
        <input
          type="text"
          className={styles.fileSize}
          value={block.fileSize || ''}
          onChange={(e) => updateBlock({ ...block, fileSize: e.target.value })}
          placeholder="Размер файла (например: 2.5 MB)"
        />
      </div>
    );
  };

  // Компонент для редактирования блока теста
  const QuizBlockEditor = ({ block }: { block: QuizBlock }) => {
    const addQuestion = () => {
      const newQuestion: QuizQuestion = {
        id: uuidv4(),
        question: '',
        options: ['', ''],
        correctOptionIndex: 0,
      };

      updateBlock({
        ...block,
        questions: [...block.questions, newQuestion],
      });
    };

    const updateQuestion = (updatedQuestion: QuizQuestion) => {
      const updatedQuestions = block.questions.map(q =>
        q.id === updatedQuestion.id ? updatedQuestion : q
      );

      updateBlock({
        ...block,
        questions: updatedQuestions,
      });
    };

    const removeQuestion = (questionId: string) => {
      const updatedQuestions = block.questions.filter(q => q.id !== questionId);

      updateBlock({
        ...block,
        questions: updatedQuestions,
      });
    };

    const addOption = (questionId: string) => {
      const question = block.questions.find(q => q.id === questionId);
      if (question) {
        const updatedQuestion = {
          ...question,
          options: [...question.options, ''],
        };
        updateQuestion(updatedQuestion);
      }
    };

    const updateOption = (questionId: string, optionIndex: number, value: string) => {
      const question = block.questions.find(q => q.id === questionId);
      if (question) {
        const updatedOptions = [...question.options];
        updatedOptions[optionIndex] = value;
        updateQuestion({
          ...question,
          options: updatedOptions,
        });
      }
    };

    const removeOption = (questionId: string, optionIndex: number) => {
      const question = block.questions.find(q => q.id === questionId);
      if (question && question.options.length > 2) {
        const updatedOptions = question.options.filter((_, index) => index !== optionIndex);
        const updatedCorrectIndex = question.correctOptionIndex >= optionIndex 
          ? Math.max(0, question.correctOptionIndex - 1)
          : question.correctOptionIndex;
          
        updateQuestion({
          ...question,
          options: updatedOptions,
          correctOptionIndex: updatedCorrectIndex,
        });
      }
    };

    return (
      <div className={styles.blockEditor}>
        <input
          type="text"
          className={styles.blockTitle}
          value={block.title || ''}
          onChange={(e) => updateBlock({ ...block, title: e.target.value })}
          placeholder="Заголовок теста"
        />
        
        <div className={styles.questionList}>
          {block.questions.map((question, qIndex) => (
            <div key={question.id} className={styles.questionItem}>
              <div className={styles.questionHeader}>
                <h4>Вопрос {qIndex + 1}</h4>
                <button 
                  type="button" 
                  className={styles.removeButton}
                  onClick={() => removeQuestion(question.id)}
                >
                  Удалить
                </button>
              </div>
              
              <input
                type="text"
                className={styles.questionText}
                value={question.question}
                onChange={(e) => updateQuestion({
                  ...question,
                  question: e.target.value,
                })}
                placeholder="Текст вопроса"
              />
              
              <div className={styles.optionsList}>
                <h5>Варианты ответов:</h5>
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className={styles.optionItem}>
                    <div className={styles.optionInput}>
                      <input
                        type="radio"
                        name={`correct-${question.id}`}
                        checked={question.correctOptionIndex === oIndex}
                        onChange={() => updateQuestion({
                          ...question,
                          correctOptionIndex: oIndex,
                        })}
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(question.id, oIndex, e.target.value)}
                        placeholder={`Вариант ${oIndex + 1}`}
                      />
                    </div>
                    
                    {question.options.length > 2 && (
                      <button 
                        type="button" 
                        className={styles.removeOptionButton}
                        onClick={() => removeOption(question.id, oIndex)}
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
                
                <button 
                  type="button" 
                  className={styles.addButton}
                  onClick={() => addOption(question.id)}
                >
                  Добавить вариант
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <button 
          type="button" 
          className={styles.addButton}
          onClick={addQuestion}
        >
          Добавить вопрос
        </button>
      </div>
    );
  };

  // Компонент для редактирования блока кода
  const CodeBlockEditor = ({ block }: { block: CodeBlock }) => {
    const languageOptions = [
      'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp',
      'ruby', 'php', 'swift', 'go', 'html', 'css', 'sql', 'bash', 'rust'
    ];

    return (
      <div className={styles.blockEditor}>
        <input
          type="text"
          className={styles.blockTitle}
          value={block.title || ''}
          onChange={(e) => updateBlock({ ...block, title: e.target.value })}
          placeholder="Заголовок блока"
        />
        
        <div className={styles.codeSettings}>
          <select
            value={block.language}
            onChange={(e) => updateBlock({ ...block, language: e.target.value })}
            className={styles.languageSelect}
          >
            {languageOptions.map(lang => (
              <option key={lang} value={lang}>
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        <textarea
          className={styles.codeEditor}
          value={block.code}
          onChange={(e) => updateBlock({ ...block, code: e.target.value })}
          placeholder={`// Введите код на ${block.language}`}
          rows={10}
        />
      </div>
    );
  };

  // Компонент для редактирования блока задания
  const AssignmentBlockEditor = ({ block }: { block: AssignmentBlock }) => {
    return (
      <div className={styles.blockEditor}>
        <input
          type="text"
          className={styles.blockTitle}
          value={block.title || ''}
          onChange={(e) => updateBlock({ ...block, title: e.target.value })}
          placeholder="Заголовок задания"
        />
        
        <textarea
          className={styles.instructions}
          value={block.instructions}
          onChange={(e) => updateBlock({ ...block, instructions: e.target.value })}
          placeholder="Инструкции к заданию"
          rows={8}
        />
        
        <div className={styles.assignmentSettings}>
          <div className={styles.settingField}>
            <label>Срок сдачи:</label>
            <input
              type="date"
              value={block.dueDate || ''}
              onChange={(e) => updateBlock({ ...block, dueDate: e.target.value })}
            />
          </div>
          
          <div className={styles.settingField}>
            <label>Баллы:</label>
            <input
              type="number"
              min="0"
              value={block.points || ''}
              onChange={(e) => updateBlock({ 
                ...block, 
                points: e.target.value ? parseInt(e.target.value) : undefined 
              })}
            />
          </div>
        </div>
      </div>
    );
  };

  // Рендер редактора для активного блока в зависимости от его типа
  const renderActiveBlockEditor = () => {
    if (!activeBlockId) return null;

    const activeBlock = blocks.find(block => block.id === activeBlockId);
    if (!activeBlock) return null;

    switch (activeBlock.type) {
      case ContentBlockType.TEXT:
        return <TextBlockEditor block={activeBlock as TextBlock} />;
      case ContentBlockType.VIDEO:
        return <VideoBlockEditor block={activeBlock as VideoBlock} />;
      case ContentBlockType.IMAGE:
        return <ImageBlockEditor block={activeBlock as ImageBlock} />;
      case ContentBlockType.EMBED:
        return <EmbedBlockEditor block={activeBlock as EmbedBlock} />;
      case ContentBlockType.FILE:
        return <FileBlockEditor block={activeBlock as FileBlock} />;
      case ContentBlockType.QUIZ:
        return <QuizBlockEditor block={activeBlock as QuizBlock} />;
      case ContentBlockType.CODE:
        return <CodeBlockEditor block={activeBlock as CodeBlock} />;
      case ContentBlockType.ASSIGNMENT:
        return <AssignmentBlockEditor block={activeBlock as AssignmentBlock} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.editorContainer}>
      {/* Панель с доступными блоками */}
      <div className={styles.blockToolbar}>
        <h3>Блоки контента</h3>
        <div className={styles.blockTypes}>
          {Object.values(ContentBlockType).map(type => (
            <div
              key={type}
              className={styles.blockType}
              draggable={!readOnly}
              onDragStart={(e) => handleDragStart(e, type)}
              onClick={() => !readOnly && addBlock(type)}
            >
              <div className={styles.blockTypeIcon}>{getBlockIcon(type)}</div>
              <div className={styles.blockTypeName}>{getBlockTypeName(type)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.editorWorkspace}>
        {/* Основная область, где будут располагаться блоки */}
        <div className={styles.blocksContainer}>
          <h3>Содержимое урока</h3>
          {blocks.length === 0 ? (
            <div 
              className={styles.emptyBlocks}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverIndex(0);
              }}
              onDrop={(e) => handleDrop(e, 0)}
            >
              {readOnly ? (
                'Урок пока не содержит блоков'
              ) : (
                'Перетащите блоки из панели слева или нажмите на нужный блок, чтобы добавить его'
              )}
            </div>
          ) : (
            <div className={styles.blocksList}>
              {blocks
                .sort((a, b) => a.order - b.order)
                .map((block, index) => (
                  <React.Fragment key={block.id}>
                    {dragOverIndex === index && (
                      <div className={styles.dropIndicator} />
                    )}
                    <div 
                      className={`${styles.blockItem} ${activeBlockId === block.id ? styles.activeBlock : ''}`}
                      onClick={() => !readOnly && setActiveBlockId(block.id)}
                      draggable={!readOnly}
                      onDragStart={(e) => handleDragStart(e, null, block.id)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className={styles.blockHeader}>
                        <div className={styles.blockTypeIndicator}>
                          <span className={styles.blockTypeIcon}>{getBlockIcon(block.type)}</span>
                          <span>{getBlockTypeName(block.type)}</span>
                        </div>
                        <div className={styles.blockTitle}>{block.title || `Блок ${index + 1}`}</div>
                        {!readOnly && (
                          <div className={styles.blockActions}>
                            <button
                              type="button"
                              className={styles.removeBlockButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeBlock(block.id);
                              }}
                            >
                              &times;
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              {dragOverIndex === blocks.length && (
                <div className={styles.dropIndicator} />
              )}
            </div>
          )}
        </div>

        {/* Редактор активного блока */}
        {!readOnly && activeBlockId && (
          <div className={styles.blockEditorContainer}>
            <h3>Редактирование блока</h3>
            {renderActiveBlockEditor()}
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonEditor;