import {Client} from "@notionhq/client";
import {
  type BlockObjectResponse,
  type GetPageResponse,
  type PageObjectResponse,
  type PartialBlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints.js";
import {
  EnvironmentVariable,
  isBlockObjectResponse,
  isPageObjectResponse,
  requireEnvVariable,
} from "./util.js";

let notionSingleton: Client | null = null;

export function getOrSetNotionClient(): Client {
  if (notionSingleton === null) {
    const notionToken = requireEnvVariable(EnvironmentVariable.NotionToken);

    notionSingleton = new Client({
      auth: notionToken,
    });
  }

  return notionSingleton;
}

export async function fetchPageContents(
  pageId: string
): Promise<Array<PartialBlockObjectResponse | BlockObjectResponse>> {
  const pageSize = requireEnvVariable(EnvironmentVariable.FetchPageSize);

  const response = await getOrSetNotionClient().blocks.children.list({
    block_id: pageId,
    page_size: parseInt(pageSize),
  });

  return response.results;
}

export type ExtendedPageResponse = GetPageResponse & {
  last_edited_time: string;
};

export async function fetchSharedPages(): Promise<PageObjectResponse[]> {
  const response = await getOrSetNotionClient().search({
    query: "",
    sort: {
      direction: "descending",
      timestamp: "last_edited_time",
    },
    filter: {
      value: "page",
      property: "object",
    },
  });

  const pages: PageObjectResponse[] = [];

  for (const result of response.results) {
    if (isPageObjectResponse(result)) {
      pages.push(result);
    }
  }

  return pages;
}

export async function fetchBlockChildren(
  blockId: string
): Promise<BlockObjectResponse[]> {
  const children = await getOrSetNotionClient().blocks.children.list({
    block_id: blockId,
  });

  const blocks: BlockObjectResponse[] = [];

  for (const result of children.results) {
    if (isBlockObjectResponse(result)) {
      blocks.push(result);
    }
  }
  return blocks;
}
