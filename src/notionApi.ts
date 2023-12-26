import { Client } from "@notionhq/client";
import { EnvironmentVariable, requireEnvVariable } from "./util.js";
import {
  PartialBlockObjectResponse,
  BlockObjectResponse,
  GetPageResponse,
} from "@notionhq/client/build/src/api-endpoints.js";

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
): Promise<(PartialBlockObjectResponse | BlockObjectResponse)[]> {
  const response = await getOrSetNotionClient().blocks.children.list({
    block_id: pageId,
    page_size: 50,
  });

  return response.results;
}

export type ExtendedPageResponse = GetPageResponse & {
  last_edited_time: string;
};

export function fetchPageDetails(
  pageId: string
): Promise<ExtendedPageResponse> {
  return getOrSetNotionClient().pages.retrieve({ page_id: pageId }) as any;
}

export async function fetchLastEditedTime(): Promise<string> {
  const pageDetails = await fetchPageDetails(
    requireEnvVariable(EnvironmentVariable.NotionPageId)
  );

  return pageDetails.last_edited_time;
}
