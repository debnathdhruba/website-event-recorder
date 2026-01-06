const fs = require('fs').promises;
const path = require('path');
const { groupByEndpoint, generateBackendInsights } = require('../utils/helpers');

class MarkdownReporter {
  static async generate(data, reportDir) {
    let markdown = `# Website Interaction Analysis\n\n`;
    markdown += `**Session**: ${data.session.name}\n`;
    markdown += `**URL**: ${data.session.url}\n`;
    markdown += `**Duration**: ${data.session.duration}\n`;
    markdown += `**Recorded**: ${data.session.startTime}\n\n`;

    markdown += `## Summary Statistics\n\n`;
    markdown += `- Total API Calls: ${data.apiCalls.length}\n`;
    markdown += `- User Interactions: ${data.interactions.length}\n`;
    markdown += `- Console Events: ${data.events.length}\n`;
    markdown += `- Unique Endpoints: ${[...new Set(data.apiCalls.map(c => 
      new URL(c.url).pathname
    ))].length}\n\n`;

    // Categorize interactions
    const interactionCategories = this.categorizeInteractions(data.interactions);

    markdown += `## Interaction Breakdown\n\n`;
    for (const [category, interactions] of Object.entries(interactionCategories)) {
      markdown += `- **${category}**: ${interactions.length}\n`;
    }
    markdown += `\n`;

    markdown += `## API Endpoints Discovered\n\n`;
    const endpoints = groupByEndpoint(data.apiCalls);
    
    for (const [endpoint, calls] of Object.entries(endpoints)) {
      markdown += `### \`${endpoint}\`\n\n`;
      markdown += `**Call Count**: ${calls.length}\n`;
      markdown += `**Methods**: ${[...new Set(calls.map(c => c.method))].join(', ')}\n\n`;

      const example = calls[0];
      
      if (example.postData) {
        markdown += `**Example Request**:\n\`\`\`json\n`;
        try {
          markdown += JSON.stringify(JSON.parse(example.postData), null, 2);
        } catch {
          markdown += example.postData;
        }
        markdown += `\n\`\`\`\n\n`;
      }

      if (example.response?.parsedBody) {
        markdown += `**Example Response**:\n\`\`\`json\n`;
        markdown += JSON.stringify(example.response.parsedBody, null, 2);
        markdown += `\n\`\`\`\n\n`;
      }
    }

    markdown += `## Frontend Interaction Flow\n\n`;
    
    if (interactionCategories['Clicks'] && interactionCategories['Clicks'].length > 0) {
      markdown += `### User Clicks\n\n`;
      interactionCategories['Clicks'].forEach((interaction, i) => {
        markdown += `${i + 1}. **${interaction.type.toUpperCase()}** on \`${interaction.element.selector}\``;
        if (interaction.element.text) {
          markdown += ` - "${interaction.element.text}"`;
        }
        if (interaction.position) {
          markdown += ` at (${interaction.position.x}, ${interaction.position.y})`;
        }
        markdown += `\n`;
      });
      markdown += `\n`;
    }

    if (interactionCategories['Form Fields'] && interactionCategories['Form Fields'].length > 0) {
      markdown += `### Form Input & Changes\n\n`;
      interactionCategories['Form Fields'].forEach((interaction, i) => {
        markdown += `${i + 1}. **${interaction.type.toUpperCase()}** on \`${interaction.element.selector}\``;
        if (interaction.element.value) {
          markdown += ` - Value: \`${interaction.element.value.substring(0, 50)}\``;
        }
        markdown += `\n`;
      });
      markdown += `\n`;
    }

    if (interactionCategories['Scrolling'] && interactionCategories['Scrolling'].length > 0) {
      markdown += `### Scroll Activity\n\n`;
      interactionCategories['Scrolling'].forEach((interaction, i) => {
        markdown += `${i + 1}. **Scrolled to** Y: ${interaction.scrollPercentage?.y || 0}% `;
        markdown += `(${interaction.scrollPosition.y}px) at ${interaction.timestamp}\n`;
      });
      markdown += `\n`;
    }

    if (interactionCategories['Focus/Blur'] && interactionCategories['Focus/Blur'].length > 0) {
      markdown += `### Focus Events\n\n`;
      interactionCategories['Focus/Blur'].forEach((interaction, i) => {
        markdown += `${i + 1}. **${interaction.type.toUpperCase()}** on \`${interaction.element.selector}\`\n`;
      });
      markdown += `\n`;
    }

    if (interactionCategories['Form Submission'] && interactionCategories['Form Submission'].length > 0) {
      markdown += `### Form Submissions\n\n`;
      interactionCategories['Form Submission'].forEach((interaction, i) => {
        markdown += `${i + 1}. **Form submitted** - Action: \`${interaction.form.action}\`, Method: ${interaction.form.method}\n`;
        if (interaction.form.fields && Object.keys(interaction.form.fields).length > 0) {
          markdown += `   - Fields: ${Object.keys(interaction.form.fields).join(', ')}\n`;
        }
      });
      markdown += `\n`;
    }

    if (interactionCategories['Keyboard'] && interactionCategories['Keyboard'].length > 0) {
      markdown += `### Keyboard Input\n\n`;
      interactionCategories['Keyboard'].forEach((interaction, i) => {
        markdown += `${i + 1}. **${interaction.key} pressed** on \`${interaction.element.selector}\`\n`;
      });
      markdown += `\n`;
    }

    markdown += `## Backend Architecture Insights\n\n`;
    markdown += generateBackendInsights(data.apiCalls);

    await fs.writeFile(
      path.join(reportDir, 'ai_analysis.md'),
      markdown
    );
  }

  static categorizeInteractions(interactions) {
    const categories = {
      'Clicks': [],
      'Form Fields': [],
      'Scrolling': [],
      'Focus/Blur': [],
      'Form Submission': [],
      'Keyboard': [],
      'Mouse Hover': [],
      'Other': []
    };

    interactions.forEach(interaction => {
      const type = interaction.type.toLowerCase();
      
      if (type === 'click' || type === 'doubleclick' || type === 'rightclick') {
        categories['Clicks'].push(interaction);
      } else if (type === 'input' || type === 'change') {
        categories['Form Fields'].push(interaction);
      } else if (type === 'scroll') {
        categories['Scrolling'].push(interaction);
      } else if (type === 'focus' || type === 'blur') {
        categories['Focus/Blur'].push(interaction);
      } else if (type === 'submit') {
        categories['Form Submission'].push(interaction);
      } else if (type === 'keypress') {
        categories['Keyboard'].push(interaction);
      } else if (type === 'mouseenter' || type === 'mouseleave') {
        categories['Mouse Hover'].push(interaction);
      } else {
        categories['Other'].push(interaction);
      }
    });

    // Remove empty categories
    return Object.fromEntries(
      Object.entries(categories).filter(([_, interactions]) => interactions.length > 0)
    );
  }
}

module.exports = MarkdownReporter;
