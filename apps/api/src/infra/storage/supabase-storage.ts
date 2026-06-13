import type { PutOptions, Storage } from "@repo/backend-storage";
import type { SupabaseClient } from "@supabase/supabase-js";

export function createSupabaseStorage(
  client: SupabaseClient,
  bucket: string,
  publicBaseUrl: string,
): Storage {
  const base = publicBaseUrl.replace(/\/$/, "");

  return {
    async put(key, data, opts?: PutOptions) {
      const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
      const uploadOpts: { upsert: boolean; contentType?: string } = { upsert: true };
      if (opts?.contentType) uploadOpts.contentType = opts.contentType;
      const { error } = await client.storage.from(bucket).upload(key, bytes, uploadOpts);
      if (error) throw error;
    },

    async get(key) {
      const { data, error } = await client.storage.from(bucket).download(key);
      if (error || !data) return null;
      const ab = await data.arrayBuffer();
      return new Uint8Array(ab);
    },

    async del(key) {
      await client.storage.from(bucket).remove([key]);
    },

    async exists(key) {
      const { data } = await client.storage.from(bucket).list("", { search: key });
      return (data?.length ?? 0) > 0;
    },

    url(key) {
      return `${base}/storage/v1/object/public/${bucket}/${key}`;
    },
  };
}
