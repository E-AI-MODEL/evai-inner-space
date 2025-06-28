# Rubric Data

The application uses four structured rubric files which are imported into the `rubrics` table in Supabase:

- `rubric_VC_structured.json`
- `rubric_VA_structured.json`
- `rubric_VM_structured.json`
- `rubric_VS_structured.json`

These files are not included in the repository. Contact the maintainers or your organisation's data team to obtain the latest versions. Once downloaded, place them in a new `rubrics/` directory at the project root.

You can then import them with:

```bash
node scripts/importRubrics.ts
```
