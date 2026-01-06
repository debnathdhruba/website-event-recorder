const { logger } = require('../utils/logger');

class InteractionMonitor {
  constructor() {
    this.interactions = [];
  }

  setup(page) {
    page.on('console', async (msg) => {
      if (msg.type() === 'debug' && msg.text().startsWith('INTERACTION:')) {
        const data = JSON.parse(msg.text().replace('INTERACTION:', ''));
        this.interactions.push(data);
        this.logInteraction(data);
      }
    });

    page.addInitScript(() => {
      // Track clicks (single, double, right-click)
      document.addEventListener('click', (e) => {
        const element = e.target;
        const interaction = {
          type: 'click',
          timestamp: new Date().toISOString(),
          button: e.button === 0 ? 'left' : e.button === 1 ? 'middle' : 'right',
          element: {
            tag: element.tagName,
            id: element.id,
            className: element.className,
            text: element.innerText?.substring(0, 100),
            selector: getSelector(element),
            attributes: Array.from(element.attributes).reduce((acc, attr) => {
              acc[attr.name] = attr.value;
              return acc;
            }, {})
          },
          position: { x: e.clientX, y: e.clientY },
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey
        };
        console.debug('INTERACTION:' + JSON.stringify(interaction));
      }, true);

      // Track double clicks
      document.addEventListener('dblclick', (e) => {
        const element = e.target;
        const interaction = {
          type: 'doubleclick',
          timestamp: new Date().toISOString(),
          element: {
            tag: element.tagName,
            id: element.id,
            selector: getSelector(element),
            text: element.innerText?.substring(0, 100)
          },
          position: { x: e.clientX, y: e.clientY }
        };
        console.debug('INTERACTION:' + JSON.stringify(interaction));
      }, true);

      // Track right clicks (context menu)
      document.addEventListener('contextmenu', (e) => {
        const element = e.target;
        const interaction = {
          type: 'rightclick',
          timestamp: new Date().toISOString(),
          element: {
            tag: element.tagName,
            id: element.id,
            selector: getSelector(element)
          },
          position: { x: e.clientX, y: e.clientY }
        };
        console.debug('INTERACTION:' + JSON.stringify(interaction));
      }, true);

      // Track input changes
      document.addEventListener('input', (e) => {
        const element = e.target;
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          const interaction = {
            type: 'input',
            timestamp: new Date().toISOString(),
            element: {
              tag: element.tagName,
              id: element.id,
              name: element.name,
              type: element.type,
              selector: getSelector(element),
              placeholder: element.placeholder,
              value: element.type === 'password' || element.type === 'hidden' ? '[REDACTED]' : element.value
            }
          };
          console.debug('INTERACTION:' + JSON.stringify(interaction));
        }
      });

      // Track change events (select, radio, checkbox, etc.)
      document.addEventListener('change', (e) => {
        const element = e.target;
        let value = element.value;
        let checked = null;

        if (element.type === 'checkbox' || element.type === 'radio') {
          checked = element.checked;
        }

        const interaction = {
          type: 'change',
          timestamp: new Date().toISOString(),
          element: {
            tag: element.tagName,
            id: element.id,
            name: element.name,
            type: element.type,
            selector: getSelector(element),
            value: value,
            ...(checked !== null && { checked })
          }
        };
        console.debug('INTERACTION:' + JSON.stringify(interaction));
      });

      // Track scroll events
      let scrollTimeout;
      window.addEventListener('scroll', () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          const interaction = {
            type: 'scroll',
            timestamp: new Date().toISOString(),
            scrollPosition: {
              x: window.scrollX,
              y: window.scrollY
            },
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight
            },
            documentSize: {
              width: document.documentElement.scrollWidth,
              height: document.documentElement.scrollHeight
            },
            scrollPercentage: {
              x: Math.round((window.scrollX / (document.documentElement.scrollWidth - window.innerWidth)) * 100) || 0,
              y: Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100) || 0
            }
          };
          console.debug('INTERACTION:' + JSON.stringify(interaction));
        }, 200); // Debounce scroll events
      });

      // Track focus events
      document.addEventListener('focus', (e) => {
        const element = e.target;
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
          const interaction = {
            type: 'focus',
            timestamp: new Date().toISOString(),
            element: {
              tag: element.tagName,
              id: element.id,
              name: element.name,
              type: element.type,
              selector: getSelector(element),
              placeholder: element.placeholder
            }
          };
          console.debug('INTERACTION:' + JSON.stringify(interaction));
        }
      }, true);

      // Track blur events
      document.addEventListener('blur', (e) => {
        const element = e.target;
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
          const interaction = {
            type: 'blur',
            timestamp: new Date().toISOString(),
            element: {
              tag: element.tagName,
              id: element.id,
              name: element.name,
              type: element.type,
              selector: getSelector(element)
            }
          };
          console.debug('INTERACTION:' + JSON.stringify(interaction));
        }
      }, true);

      // Track form submissions
      document.addEventListener('submit', (e) => {
        const form = e.target;
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) {
          data[key] = value;
        }

        const interaction = {
          type: 'submit',
          timestamp: new Date().toISOString(),
          form: {
            id: form.id,
            name: form.name,
            action: form.action,
            method: form.method,
            selector: getSelector(form),
            fields: data
          }
        };
        console.debug('INTERACTION:' + JSON.stringify(interaction));
      });

      // Track keyboard events (Enter key on inputs)
      document.addEventListener('keydown', (e) => {
        const element = e.target;
        if (e.key === 'Enter' && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
          const interaction = {
            type: 'keypress',
            key: e.key,
            timestamp: new Date().toISOString(),
            element: {
              tag: element.tagName,
              id: element.id,
              name: element.name,
              type: element.type,
              selector: getSelector(element)
            },
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            altKey: e.altKey
          };
          console.debug('INTERACTION:' + JSON.stringify(interaction));
        }
      });

      // Track mouse enter/leave for elements
      document.addEventListener('mouseenter', (e) => {
        const element = e.target;
        if (element.tagName === 'A' || element.tagName === 'BUTTON' || element.className?.includes('clickable')) {
          const interaction = {
            type: 'mouseenter',
            timestamp: new Date().toISOString(),
            element: {
              tag: element.tagName,
              id: element.id,
              selector: getSelector(element),
              text: element.innerText?.substring(0, 100)
            },
            position: { x: e.clientX, y: e.clientY }
          };
          console.debug('INTERACTION:' + JSON.stringify(interaction));
        }
      }, true);

      function getSelector(element) {
        if (element.id) return `#${element.id}`;
        if (element.className) {
          const classes = element.className.split(' ').filter(c => c).join('.');
          return `${element.tagName.toLowerCase()}.${classes}`;
        }
        return element.tagName.toLowerCase();
      }
    });
  }

  logInteraction(interaction) {
    const typeUpper = interaction.type.toUpperCase();
    let logMessage = `${typeUpper}`;
    
    if (interaction.element?.selector) {
      logMessage += ` on ${interaction.element.selector}`;
    }
    
    if (interaction.element?.text) {
      logMessage += ` - "${interaction.element.text}"`;
    }

    if (interaction.type === 'scroll') {
      logMessage += ` - Y: ${interaction.scrollPercentage.y}%`;
    }

    if (interaction.element?.value) {
      const value = interaction.element.value.substring(0, 50);
      logMessage += ` - Value: "${value}"`;
    }

    logger.interaction(logMessage);
  }

  getInteractions() {
    return this.interactions;
  }
}

module.exports = InteractionMonitor;
