import * as core from '@actions/core';
import dedent from 'ts-dedent';
import { parseInput } from '../src/input';

jest.mock('@actions/core');

describe('input parsing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parses valid YAML env-overrides', () => {
    const yaml = dedent`
      BASE_URL: https://staging.example.com
      API_KEY: abc123
      ENABLE_CACHE: true
    `;
    (core.getInput as jest.Mock).mockImplementation((name: string) => {
      if (name === 'api-key') return 'test-api-key';
      if (name === 'project-id') return 'test-project-id';
      if (name === 'env-overrides') return yaml;
      return '';
    });

    const input = parseInput();
    if (input.version !== 'v2') throw new Error('Expected v2 input');
    expect(input.envOverrides).toEqual({
      BASE_URL: 'https://staging.example.com',
      API_KEY: 'abc123',
      ENABLE_CACHE: true
    });
  });

  it('parses valid JSON env-overrides', () => {
    const json = JSON.stringify({
      BASE_URL: 'https://staging.example.com',
      API_KEY: 'abc123',
      ENABLE_CACHE: true
    });
    (core.getInput as jest.Mock).mockImplementation((name: string) => {
      if (name === 'api-key') return 'test-api-key';
      if (name === 'project-id') return 'test-project-id';
      if (name === 'env-overrides') return json;
      return '';
    });

    const input = parseInput();
    if (input.version !== 'v2') throw new Error('Expected v2 input');
    expect(input.envOverrides).toEqual({
      BASE_URL: 'https://staging.example.com',
      API_KEY: 'abc123',
      ENABLE_CACHE: true
    });
  });

  it('fails on invalid YAML/JSON', () => {
    (core.getInput as jest.Mock).mockImplementation((name: string) => {
      if (name === 'api-key') return 'test-api-key';
      if (name === 'project-id') return 'test-project-id';
      if (name === 'env-overrides') return '{ invalid json ';
      return '';
    });

    expect(() => parseInput()).toThrow();
    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('contains an invalid object')
    );
  });

  it('fails on non-object YAML (e.g. string or array)', () => {
    (core.getInput as jest.Mock).mockImplementation((name: string) => {
      if (name === 'api-key') return 'test-api-key';
      if (name === 'project-id') return 'test-project-id';
      if (name === 'env-overrides') return '- item1\n- item2';
      return '';
    });

    expect(() => parseInput()).toThrow();
    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('Expected a key-value object')
    );
  });
});
