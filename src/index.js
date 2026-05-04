const fastify = require('fastify');
const { Client } = require('pg');

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  const SCHEMA = process.env.SCHEMA || 'motion_render';
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  const helpers = {
    client,
    schema: SCHEMA,
    async markStatus(name, status, errorText) {
      await client.query(
        'UPDATE ' + SCHEMA + '.nodes SET status=$1, last_loaded_at=now(), error_text=$2, load_count=load_count+1 WHERE name=$3',
        [status, errorText || '', name]
      );
    },
  };

  const app = fastify();
  app.__schema = SCHEMA;

  const res = await client.query(
    "SELECT code_text FROM " + SCHEMA + ".nodes WHERE name='_shell_orchestrator' AND active=true ORDER BY version DESC LIMIT 1"
  );
  const code = res.rows[0] && res.rows[0].code_text;
  if (!code) throw new Error('No orchestrator found');
  await helpers.markStatus('_shell_orchestrator', 'deploying');
  const mod = { exports: {} };
  const fn = new Function('module', 'exports', 'require', 'app', 'helpers', code);
  fn(mod, mod.exports, require, app, helpers);
  if (typeof mod.exports.register !== 'function') throw new Error('orchestrator did not export register');
  await mod.exports.register(app, helpers);
  await helpers.markStatus('_shell_orchestrator', 'deployed');

  const port = parseInt(process.env.PORT || '3000', 10);
  await app.listen({ host: '0.0.0.0', port });
  console.log('[motion-render] listening on :' + port + ' schema=' + SCHEMA);
}
main().catch(e => { console.error(e); process.exit(1); });
