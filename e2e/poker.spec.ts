import { test, expect, type Page } from '@playwright/test'

// The app auto-rejoins via localStorage, so every player needs an isolated
// browser context (a second page in the same context silently reuses the
// first player's identity).

const VOTE_TIMEOUT = 15_000 // realtime sync through the local wrangler worker

async function createRoom(page: Page, name: string, deck?: string): Promise<string> {
  await page.goto('/')
  await page.getByRole('button', { name: 'Create Room' }).click()
  await page.getByRole('textbox', { name: 'Your Name' }).fill(name)
  if (deck) await page.getByLabel('Select Deck Type').selectOption({ label: deck })
  await page.getByRole('button', { name: 'Create', exact: true }).click()
  await expect(page).toHaveURL(/\/room\//, { timeout: VOTE_TIMEOUT })
  return page.url().split('/').pop()!
}

async function joinRoom(page: Page, roomId: string, name: string) {
  await page.goto(`/room/${roomId}`)
  await page.getByRole('textbox', { name: 'Your Name' }).fill(name)
  await page.getByRole('button', { name: 'Join', exact: true }).click()
  await expect(page.getByText(`${name} (You)`)).toBeVisible({ timeout: VOTE_TIMEOUT })
}

async function vote(page: Page, value: string) {
  await page.getByRole('group', { name: 'Select your estimate' }).getByRole('button', { name: value, exact: true }).click()
}

function status(page: Page) {
  return page.getByRole('status')
}

test('home page renders and validates join input', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'VibePOKER', level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Create Room' })).toBeVisible()

  // Join button stays disabled without a room id
  await expect(page.getByRole('button', { name: 'Join Room' })).toBeDisabled()
  await page.getByRole('textbox', { name: 'Room ID' }).fill('testroom')
  await expect(page.getByRole('button', { name: 'Join Room' })).toBeEnabled()
})

test('create room shows host, deck cards, and empty state', async ({ page }) => {
  await createRoom(page, 'Alice', 'Fibonacci (0, 1, 2, 3, 5...)')

  await expect(page.getByRole('heading', { name: /No topic set/ })).toBeVisible()
  await expect(status(page)).toContainText('0/1 voted')
  await expect(page.getByText('Alice (You)')).toBeVisible()
  for (const card of ['0', '1', '2', '3', '5', '8', '13']) {
    await expect(page.getByRole('group', { name: 'Select your estimate' }).getByRole('button', { name: card, exact: true })).toBeVisible()
  }
  await expect(page.getByRole('button', { name: 'Reveal' })).toBeDisabled()
})

test('full round: two players vote, reveal, accept, history, new round', async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const guestCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const guest = await guestCtx.newPage()

  const roomId = await createRoom(host, 'Alice')
  await joinRoom(guest, roomId, 'Bob')

  // Non-host has no reveal control at all
  await expect(guest.getByRole('button', { name: 'Reveal' })).toBeHidden()

  await host.getByRole('button', { name: 'Edit topic' }).click()
  await host.getByRole('textbox', { name: 'Topic' }).fill('Login flow')
  await host.getByRole('button', { name: 'Save' }).click()
  await expect(host.getByRole('heading', { name: 'Login flow' })).toBeVisible()

  await vote(host, '3')
  await expect(status(host)).toContainText('1/2 voted', { timeout: VOTE_TIMEOUT })
  await expect(status(guest)).toContainText('1/2 voted', { timeout: VOTE_TIMEOUT })

  await vote(guest, '5')
  await expect(status(host)).toContainText('2/2 voted', { timeout: VOTE_TIMEOUT })

  await host.getByRole('button', { name: 'Reveal' }).click()
  const results = guest.getByRole('region', { name: 'Results' })
  await expect(results).toBeVisible({ timeout: VOTE_TIMEOUT })
  // Suggestion "3", average/median "4" (values may render in several spots)
  await expect(results.getByText('3', { exact: true }).first()).toBeVisible()
  await expect(results.getByText('4', { exact: true }).first()).toBeVisible()
  await expect(guest.getByRole('progressbar', { name: '5: 1 votes' })).toBeVisible()
  // Results propagate to both players
  await expect(host.getByRole('region', { name: 'Results' })).toBeVisible()

  // Non-host has no accept control
  await expect(guest.getByRole('button', { name: 'Accept' })).toBeHidden()

  await host.getByRole('button', { name: 'Accept' }).click()
  await expect(host.getByRole('region', { name: 'History' })).toBeVisible({ timeout: VOTE_TIMEOUT })
  await expect(guest.getByRole('region', { name: 'History' })).toBeVisible({ timeout: VOTE_TIMEOUT })

  await host.getByRole('button', { name: 'New Round', exact: true }).click()
  await expect(status(host)).toContainText('0/2 voted', { timeout: VOTE_TIMEOUT })
  await expect(host.getByRole('region', { name: 'Results' })).toBeHidden({ timeout: VOTE_TIMEOUT })
  // New Round starts fresh: topic is cleared (Re-vote keeps the topic instead)
  await expect(host.getByRole('heading', { name: /No topic set/ })).toBeVisible({ timeout: VOTE_TIMEOUT })

  await hostCtx.close()
  await guestCtx.close()
})

test('reveal shows all cards without accepting', async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const guestCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const guest = await guestCtx.newPage()

  const roomId = await createRoom(host, 'Alice')
  await joinRoom(guest, roomId, 'Bob')
  await vote(host, '3')
  await expect(status(host)).toContainText('1/2 voted', { timeout: VOTE_TIMEOUT })
  await vote(guest, '5')
  await expect(status(host)).toContainText('2/2 voted', { timeout: VOTE_TIMEOUT })

  await host.getByRole('button', { name: 'Reveal' }).click()
  const players = guest.getByRole('region', { name: 'Players (2)' })
  await expect(players.getByText('3')).toBeVisible({ timeout: VOTE_TIMEOUT })
  await expect(players.getByText('5')).toBeVisible()

  // Re-vote resets votes but keeps the revealed topic visible
  await host.getByRole('button', { name: 'Re-vote' }).click()
  await expect(status(host)).toContainText('0/2 voted', { timeout: VOTE_TIMEOUT })
  await expect(host.getByRole('region', { name: 'Results' })).toBeHidden({ timeout: VOTE_TIMEOUT })

  await hostCtx.close()
  await guestCtx.close()
})

test('deck selection changes available cards', async ({ page }) => {
  await createRoom(page, 'Alice', 'T-Shirt (XS, S, M...)')
  const deck = page.getByRole('group', { name: 'Select your estimate' })
  for (const card of ['XS', 'S', 'M', 'L', 'XL']) {
    await expect(deck.getByRole('button', { name: card, exact: true })).toBeVisible()
  }
  await expect(deck.getByRole('button', { name: '13' })).toBeHidden()
})
