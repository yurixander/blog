import { Client } from "@notionhq/client";
import {
  BlockObjectResponse,
  GetPageResponse,
  PartialBlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

export async function getPageContent(
  notion: Client,
  pageId: string
): Promise<(PartialBlockObjectResponse | BlockObjectResponse)[]> {
  const response = await notion.blocks.children.list({
    block_id: pageId,
    page_size: 50,
  });

  return response.results;
}

export function getPageDetails(
  notion: Client,
  pageId: string
): Promise<GetPageResponse> {
  return notion.pages.retrieve({ page_id: pageId });
}
