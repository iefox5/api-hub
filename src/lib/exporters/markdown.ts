import type { ApiTask, Project } from '../types'

export function exportMarkdown(project: Project, tasks: ApiTask[]): string {
  const doneTasks = tasks.filter((t) => t.status === 'done')

  let md = `# ${project.name} API Documentation\n\n`

  if (project.description) {
    md += `${project.description}\n\n`
  }

  if (project.graphql_endpoint) {
    md += `**Endpoint:** \`${project.graphql_endpoint}\`\n\n`
  }

  md += `---\n\n`
  md += `## APIs\n\n`

  for (const task of doneTasks) {
    md += `### ${task.title}\n\n`

    if (task.description) {
      md += `${task.description}\n\n`
    }

    if (task.endpoint) {
      md += `**Endpoint:** \`${task.method || 'GET'} ${task.endpoint}\`\n\n`
    }

    md += `**Type:** ${task.api_type}\n\n`
    md += `**Priority:** ${task.priority}\n\n`

    if (task.contract) {
      md += `#### Contract\n\n`
      md += '```json\n'
      md += JSON.stringify(task.contract, null, 2)
      md += '\n```\n\n'
    }

    md += `---\n\n`
  }

  md += `\n*Generated on ${new Date().toISOString().split('T')[0]}*\n`

  return md
}
