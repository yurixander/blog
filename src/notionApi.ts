import { Client } from "@notionhq/client";
import { requireEnvVariable } from "./util.js";
import {
  PartialBlockObjectResponse,
  BlockObjectResponse,
  GetPageResponse,
} from "@notionhq/client/build/src/api-endpoints.js";

let notionSingleton: Client | null = null;

export function getNotionClient(): Client {
  if (notionSingleton === null) {
    notionSingleton = new Client({
      auth: requireEnvVariable(process.env.NOTION_TOKEN),
    });
  }

  return notionSingleton;
}

export async function getPageContent(
  pageId: string
): Promise<(PartialBlockObjectResponse | BlockObjectResponse)[]> {
  const response = await getNotionClient().blocks.children.list({
    block_id: pageId,
    page_size: 50,
  });

  return response.results;
}

export type ExtendedPageResponse = GetPageResponse & {
  last_edited_time: string;
};

export function getPageDetails(pageId: string): Promise<ExtendedPageResponse> {
  return getNotionClient().pages.retrieve({ page_id: pageId }) as any;
}

export async function getLastEditedTime(): Promise<string> {
  const pageDetails = await getPageDetails(
    requireEnvVariable(process.env.NOTION_PAGE_ID)
  );

  return pageDetails.last_edited_time;
}
