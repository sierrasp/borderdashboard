import db from '$lib/db';

export async function get() {
  let q = 'select * from rss_times limit 1;'
  const { rows } = await db.query('select * from rss_times limit 1;')

  if (rows) {
    return {
      body: { rows }
    };
  }

  return {
    status: 404
  };
}