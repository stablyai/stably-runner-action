import { context, getOctokit } from '@actions/github';

export type GithubMetadata = {
  branch: string;
  commit: {
    sha: string;
    timestamp?: string;
    message: string;
  };
};

export async function fetchMetadata(
  githubToken: string
): Promise<GithubMetadata | undefined> {
  const octokit = getOctokit(githubToken);

  const branchName = context.ref.replace('refs/heads/', '');
  const commitSha = context.sha;

  const { data: commitData } = await octokit.rest.repos.getCommit({
    owner: context.repo.owner,
    repo: context.repo.repo,
    ref: commitSha
  });

  return {
    branch: branchName,
    commit: {
      sha: commitSha,
      timestamp: commitData?.commit?.author?.date,
      message: commitData?.commit?.message
    }
  };
}
