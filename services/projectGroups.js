/* =================================================================
   PROJECT GROUPS — shared helper for organizing a company's flat
   project list into an ordered tree of groups + standalone projects.

   Data model (single source = PROJECTS_DATA / the merged CV arrays):
     • A GROUP is an entry with `isGroup: true` and a `name`.
     • A MEMBER project carries `group: "<group name>"` (case-insensitive
       match to the group's name within the same company).
     • Anything else is a standalone project.

   Loaded by the CV (/cv/) and the projects gallery (/projects/) so both
   render groups identically. Detail pages don't need it.
   ================================================================= */
window.ProjectGroups = (function () {
    function isGroup(p) { return !!(p && p.isGroup); }
    function key(s) { return String(s || '').trim().toLowerCase(); }

    /* organize(list) → ordered array of items:
         { type: 'group',   group,   members: [ {type:'project', project, index} ] , index }
         { type: 'project', project, index }
       `index` is the position in the input list, so callers (renderers /
       edit affordances) can map an item back to its source entry. Group
       items appear at the group entry's position; members attach to their
       group regardless of where they sit in the array; projects that name a
       missing group fall back to standalone. */
    function organize(list) {
        list = Array.isArray(list) ? list : [];
        const byName = new Map();
        list.forEach((p, i) => {
            if (isGroup(p)) byName.set(key(p.name), { type: 'group', group: p, members: [], index: i });
        });
        const out = [];
        list.forEach((p, i) => {
            if (isGroup(p)) {
                out.push(byName.get(key(p.name)));
                return;
            }
            const g = p.group ? byName.get(key(p.group)) : null;
            if (g) g.members.push({ type: 'project', project: p, index: i });
            else out.push({ type: 'project', project: p, index: i });
        });
        return out;
    }

    /* Names of all groups defined for a company (for the "move to group"
       dropdown in the project editor). `list` is that company's entries. */
    function groupNames(list) {
        return (Array.isArray(list) ? list : [])
            .filter(isGroup)
            .map(g => String(g.name || '').trim())
            .filter(Boolean);
    }

    return { isGroup, organize, groupNames, key };
})();
