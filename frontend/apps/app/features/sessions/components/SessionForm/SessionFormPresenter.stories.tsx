import type { Meta, StoryObj } from '@storybook/react'
import type { Projects } from '@/components/CommonLayout/AppBar/ProjectsDropdownMenu/services/getProjects'
import { SessionFormPresenter } from './SessionFormPresenter'

const mockProjects: Projects = [
  {
    id: '1',
    name: 'E-commerce Platform',
  },
  {
    id: '2',
    name: 'Analytics Dashboard',
  },
  {
    id: '3',
    name: 'User Management System',
  },
]

const mockBranches = [
  {
    name: 'main',
    sha: 'abc123',
    protected: true,
  },
  {
    name: 'feature/user-auth',
    sha: 'def456',
    protected: false,
  },
  {
    name: 'develop',
    sha: 'ghi789',
    protected: false,
  },
]

const meta = {
  component: SessionFormPresenter,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof SessionFormPresenter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    projects: mockProjects,
    branches: [],
    isBranchesLoading: false,
    isPending: false,
    onProjectChange: () => {},
    formAction: () => {},
    schemaFilePath: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default state with projects available but no branches loaded.',
      },
    },
  },
}

// With default project and branches loaded
export const WithBranches: Story = {
  args: {
    projects: mockProjects,
    defaultProjectId: '1',
    branches: mockBranches,
    isBranchesLoading: false,
    isPending: false,
    onProjectChange: () => {},
    formAction: () => {},
    schemaFilePath: 'db/schema.rb',
  },
  parameters: {
    docs: {
      description: {
        story: 'Form with a project selected and branches loaded.',
      },
    },
  },
}

// Loading branches state
export const LoadingBranches: Story = {
  args: {
    projects: mockProjects,
    defaultProjectId: '1',
    branches: [],
    isBranchesLoading: true,
    isPending: false,
    onProjectChange: () => {},
    formAction: () => {},
    schemaFilePath: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'Form state while branches are being loaded.',
      },
    },
  },
}

// With branches error
export const WithBranchesError: Story = {
  args: {
    projects: mockProjects,
    defaultProjectId: '1',
    branches: [],
    isBranchesLoading: false,
    branchesError: 'Failed to load branches',
    isPending: false,
    onProjectChange: () => {},
    formAction: () => {},
    schemaFilePath: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'Form state with branches loading error.',
      },
    },
  },
}

// Form submission pending
export const Pending: Story = {
  args: {
    projects: mockProjects,
    defaultProjectId: '1',
    branches: mockBranches,
    isBranchesLoading: false,
    isPending: true,
    onProjectChange: () => {},
    formAction: () => {},
    schemaFilePath: 'database.sql',
  },
  parameters: {
    docs: {
      description: {
        story: 'Form state during submission with loading button.',
      },
    },
  },
}

// With form error
export const WithFormError: Story = {
  args: {
    projects: mockProjects,
    defaultProjectId: '1',
    branches: mockBranches,
    isBranchesLoading: false,
    formError: 'Please provide an initial message',
    isPending: false,
    onProjectChange: () => {},
    formAction: () => {},
    schemaFilePath: 'schema.prisma',
  },
  parameters: {
    docs: {
      description: {
        story: 'Form state with a validation error message.',
      },
    },
  },
}

// No projects available
export const NoProject: Story = {
  args: {
    projects: [],
    branches: [],
    isBranchesLoading: false,
    isPending: false,
    onProjectChange: () => {},
    formAction: () => {},
    schemaFilePath: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'Form state when no projects are available.',
      },
    },
  },
}
