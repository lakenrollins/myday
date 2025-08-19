import './variables.css';

export const initializeGlobalStyles = () => {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: var(--font-family);
      background-color: var(--background);
      color: var(--text);
      line-height: 1.6;
    }

    html, body, #root {
      height: 100%;
    }

    a {
      text-decoration: none;
      color: inherit;
    }

    button {
      border: none;
      background: none;
      cursor: pointer;
      font-family: inherit;
    }

    input, textarea {
      font-family: inherit;
      border: none;
      outline: none;
    }

    img {
      max-width: 100%;
      height: auto;
      display: block;
    }

    ::-webkit-scrollbar {
      width: 8px;
    }

    ::-webkit-scrollbar-track {
      background: var(--gray-100);
    }

    ::-webkit-scrollbar-thumb {
      background: var(--gray-400);
      border-radius: var(--radius-sm);
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--gray-500);
    }
  `;
  
  document.head.appendChild(styleElement);
};