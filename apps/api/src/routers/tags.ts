import { compareTr } from '@homelibra/core';
import { TRPCError } from '@trpc/server';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { noteTag, source, sourceTag, tag } from '../db/schema';
import { resolveTags, setSourceTags, tagNames, tagsOfSource } from '../tags/tags';
import { libraryProcedure, router } from '../trpc/init';

export const tagsRouter = router({
  /**
   * Every Tag in the Library with how many Notes and Sources carry it
   * ("N not · M kaynak"): A–Z, Çok kullanılan (most carriers first), or
   * last put on first (Ana sayfa's "son kullanılan"). The Tag picker
   * suggests from the same list.
   */
  list: libraryProcedure
    .input(z.object({ sort: z.enum(['name', 'usage', 'recent']), limit: z.int().positive().optional() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.tx
        .select({
          id: tag.id,
          name: tag.name,
          noteCount: sql<number>`(select count(*) from ${noteTag} where ${noteTag.tagId} = ${tag.id})::int`,
          sourceCount: sql<number>`(select count(*) from ${sourceTag} where ${sourceTag.tagId} = ${tag.id})::int`,
          lastUsed: sql<string>`greatest(
            (select max(${noteTag.createdAt}) from ${noteTag} where ${noteTag.tagId} = ${tag.id}),
            (select max(${sourceTag.createdAt}) from ${sourceTag} where ${sourceTag.tagId} = ${tag.id}))`,
        })
        .from(tag)
        .where(eq(tag.accountId, ctx.accountId));
      type Row = (typeof rows)[number];
      const byName = (a: Row, b: Row) => compareTr(a.name, b.name);
      const order: Record<typeof input.sort, (a: Row, b: Row) => number> = {
        name: byName,
        usage: (a, b) => b.noteCount + b.sourceCount - (a.noteCount + a.sourceCount) || byName(a, b),
        recent: (a, b) => Date.parse(b.lastUsed) - Date.parse(a.lastUsed) || byName(a, b),
      };
      return rows
        .sort(order[input.sort])
        .slice(0, input.limit)
        .map(({ lastUsed: _, ...row }) => row);
    }),

  /**
   * Leaves exactly these Tags on the Source, from the Source page's heading.
   * The Source's Notes keep only their own Tags (ADR-0003); a Tag left with
   * nothing carrying it goes.
   */
  setOnSource: libraryProcedure
    .input(z.object({ sourceId: z.uuid(), names: tagNames }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.tx
        .select({ id: source.id })
        .from(source)
        .where(and(eq(source.id, input.sourceId), eq(source.accountId, ctx.accountId)));
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
      const tagIds = await resolveTags(ctx.tx, ctx.accountId, input.names);
      await setSourceTags(ctx.tx, ctx.accountId, input.sourceId, tagIds);
      return tagsOfSource(ctx.tx, ctx.accountId, input.sourceId);
    }),
});
