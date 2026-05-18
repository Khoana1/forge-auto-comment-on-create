import { COMMENT_AUTHOR_LABEL } from '../config.js';

/**
 * ADF body cho comment chào mừng issue mới.
 */
export const buildWelcomeCommentAdf = ({
  reporterDisplayName,
  createdAt,
  authorLabel = COMMENT_AUTHOR_LABEL,
}) => {
  const formattedTime = new Date(createdAt).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  return {
    version: 1,
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Chào mừng issue mới!',
            marks: [{ type: 'strong' }],
          },
          { type: 'text', text: ` — ${authorLabel}` },
        ],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: `Thời gian: ${formattedTime}` }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Reporter: ' },
          { type: 'text', text: reporterDisplayName, marks: [{ type: 'strong' }] },
        ],
      },
    ],
  };
};
