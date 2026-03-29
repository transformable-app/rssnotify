import { describe, expect, it } from 'vitest'

import { parseFeedItems } from '@/jobs/rss'

describe('parseFeedItems', () => {
  it('prefers nested Reddit content titles when the Atom entry title is missing', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>t3_1s13jri</id>
    <author>
      <name>/u/MazenTouati</name>
    </author>
    <category term="laravel" label="r/laravel" />
    <content type="html">
      &lt;table&gt;
        &lt;tr&gt;
          &lt;td&gt;
            &lt;a href="https://www.reddit.com/r/laravel/comments/1s13jri/meet_aion_a_modular_and_customizable_laravel_13/"&gt;
              &lt;img
                src="https://preview.redd.it/ux4ac35gxoqg1.png?width=640"
                alt="Meet Aion: A modular and customizable Laravel 13 starter kit"
                title="Meet Aion: A modular and customizable Laravel 13 starter kit"
              /&gt;
            &lt;/a&gt;
          &lt;/td&gt;
        &lt;/tr&gt;
      &lt;/table&gt;
    </content>
    <link href="https://www.reddit.com/r/laravel/comments/1s13jri/meet_aion_a_modular_and_customizable_laravel_13/" />
    <updated>2026-03-23T01:29:46+00:00</updated>
  </entry>
</feed>`

    const [item] = parseFeedItems(xml)

    expect(item?.title).toBe('Meet Aion: A modular and customizable Laravel 13 starter kit')
    expect(item?.link).toBe('https://www.reddit.com/r/laravel/comments/1s13jri/meet_aion_a_modular_and_customizable_laravel_13/')
  })
})
