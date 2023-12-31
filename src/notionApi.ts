import {Client} from "@notionhq/client";
import {
  type BlockObjectResponse,
  type GetPageResponse,
  type PageObjectResponse,
  type PartialBlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints.js";
import {
  EnvironmentVariable,
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
  const response = await getOrSetNotionClient().blocks.children.list({
    block_id: pageId,
    page_size: 50,
  });

  return response.results;
}

export type ExtendedPageResponse = GetPageResponse & {
  last_edited_time: string;
};

export async function fetchPageDetails(
  pageId: string
): Promise<ExtendedPageResponse> {
  // FIXME: This is temporary.
  return getOrSetNotionClient().pages.retrieve({page_id: pageId}) as any;
}

export async function fetchLastEditedTime(pageId: string): Promise<string> {
  const pageDetails = await fetchPageDetails(pageId);

  return pageDetails.last_edited_time;
}

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
