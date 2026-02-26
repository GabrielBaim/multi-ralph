[Sitemap](https://steve-yegge.medium.com/sitemap/sitemap.xml)

[Open in app](https://play.google.com/store/apps/details?id=com.medium.reader&referrer=utm_source%3DmobileNavBar&source=post_page---top_nav_layout_nav-----------------------------------------)

Sign up

[Sign in](https://medium.com/m/signin?operation=login&redirect=https%3A%2F%2Fsteve-yegge.medium.com%2Fintroducing-beads-a-coding-agent-memory-system-637d7d92514a&source=post_page---top_nav_layout_nav-----------------------global_nav------------------)

[Medium Logo](https://medium.com/?source=post_page---top_nav_layout_nav-----------------------------------------)

Get app

[Write](https://medium.com/m/signin?operation=register&redirect=https%3A%2F%2Fmedium.com%2Fnew-story&source=---top_nav_layout_nav-----------------------new_post_topnav------------------)

[Search](https://medium.com/search?source=post_page---top_nav_layout_nav-----------------------------------------)

Sign up

[Sign in](https://medium.com/m/signin?operation=login&redirect=https%3A%2F%2Fsteve-yegge.medium.com%2Fintroducing-beads-a-coding-agent-memory-system-637d7d92514a&source=post_page---top_nav_layout_nav-----------------------global_nav------------------)

![](https://miro.medium.com/v2/resize:fill:32:32/1*dmbNkD5D-u45r44go_cf0g.png)

# Introducing Beads: A coding agent memory system

[![Steve Yegge](https://miro.medium.com/v2/resize:fill:32:32/1*8Ae2b9dv-sQtme8C4_sjhA.jpeg)](https://steve-yegge.medium.com/?source=post_page---byline--637d7d92514a---------------------------------------)

[Steve Yegge](https://steve-yegge.medium.com/?source=post_page---byline--637d7d92514a---------------------------------------)

Follow

20 min read

·

Oct 13, 2025

762

30

[Listen](https://medium.com/m/signin?actionUrl=https%3A%2F%2Fmedium.com%2Fplans%3Fdimension%3Dpost_audio_button%26postId%3D637d7d92514a&operation=register&redirect=https%3A%2F%2Fsteve-yegge.medium.com%2Fintroducing-beads-a-coding-agent-memory-system-637d7d92514a&source=---header_actions--637d7d92514a---------------------post_audio_button------------------)

Share

I have been vibe coding like a madman for forty days and forty nights. It’s a long story, so I’ll summarize in these three pictures.

Press enter or click to view image in full size

![](https://miro.medium.com/v2/resize:fit:700/1*F3ygv0SRR1Ce09Nh8QfuXQ.png)

Vibe coding on the beach with Thorsten Ball, then driving 60mph, then at the mall

On the left, 3 weeks ago, we have me vibe coding on the beach at dinner in Cabo San Lucas, Mexico, with the inimitable Thorsten Ball, our buddy Matt Manela, and other Sourcegraph colleagues at our company offsite. Someone snapped this photo of me because I wouldn’t put my computer way.

In the middle, 2 weeks ago, we have a picture of me taking a picture of myself driving 60mph on the freeway up to Bellingham to pick up some guitars, vibe coding by voice the whole way there and back. Stupid and dangerous as hell. Didn’t care. Got stuck in traffic for hours. Still didn’t care. Did I mention it’s addictive? Vibe coding is addictive.

In the final frame my wife and I are at the mall last week enjoying a nice afternoon of coffee, people watching, and vibe coding with Mozart, pictured here in his favorite bag. Linh is hiding behind the computer, which is how I got executive permission to publish the pic.

I don’t go anywhere or do _anything_, not even sleep, without my laptop. Well, except for when I’m running, I haven’t quite cracked vibe coding there yet. I’m getting close. It’s a subject for another blog post, but I do finally have my agents running on GCP with Terraform and Tailscale. So I’m about to be able to vibe code on my phone, too.

The agents must never rest.

## **Six Weeks, 350k LOC, And All I Got Was This Lousy T-Shirt**

After a year of vibe coding daily, and even co-authoring a [book](https://www.amazon.com/dp/1966280025) about it(!), on the first day of September my budding vision for an agent orchestration engine finally bloomed. I immediately set sail to vibe code it into existence. I optimistically named it `vibecoder`. And then I pushed hard, day and night, as you can see from the collage above. I learned a lot, all cool stuff I’ll share in time.

Unfortunately, due to some early foundational design boo-boos, I had to burn the whole thing to the ground last week, leaving nothing but a torched TypeScript village, me, a birthday suit, and a dragon egg. That egg hatched, and the little dragon that crawled out of the ashes, [Beads](https://github.com/steveyegge/beads), is what I’m sharing with you today.

_(For the TL;DR, check out the_`README.md` _on GitHub. My goal here is to explain why Beads is the greatest invention since the issue tracker, and why you want to start using it right now, because it \*is\* an issue tracker. A special one. In a nutshell, you install the_`bd` _tool, point your_`AGENTS.md` _or_`CLAUDE.md` _at it with one line, and your agents will suddenly become good at long-horizon planning and work discovery. It’s an instant cognitive upgrade.)_

So how did we get here, launching an issue tracker (of all things) instead of my ambitious `vibecoder` project? I think my story may resonate with you, if you use Claude Code, Sourcegraph Amp, OpenAI Codex, or a similar coding agent on a daily basis.

My vision for 2025, growing ever crisper and crispier, has been to automate the agentic workflow I use every day. It’s easy to see that 95 to 99% of the interactions we have with coding agents could have been handled by a properly briefed model. “Now fix the broken tests.” “No, I don’t care which of those two things you do first.” “Yes, I’d like you to continue.” “No, you can’t drop that database table.” I mean, come _on_. My title on LinkedIn has been AI Babysitter for at least six months now, and there’s no sign of that changing any time soon.

Vibe coding involves doing the same old shit, over and over. These agents are incredibly powerful and productive, but they require constant monitoring, most of it mundane. And just like you, I want to automate that work, so that I can go back to playing video games, and still be more productive than any time in human history. Who doesn’t want that?

As our Vibe Coding book explores, there are lots of dimensions to the professional vibe-coding workflow. To do it properly, and ensure you always get high-quality outputs, there are a lot of steps you have to follow. Vibe coding has Outer, Middle, and Inner developer loops. It is, in a word, complex.

On September 1st, I bravely or foolishly decided to tackle automating all of the steps at the same time. I vibe coded up a gigantic, working system, only to discover a month later that I had made a pair of very serious architectural mistakes. Together, they had seeped through the whole system and basically totaled it. My insurance company looked at the 350k-line code base and said they’d just send me a check. It wasn’t fixable.

You can go ahead and laugh it up. But you didn’t get a dragon egg _or_ a birthday suit _or_ an incinerated TypeScript village _or_ emotional scarring. I have no regrets. A few. Some. I have some… a lot. I have a lot of regrets. But we need to save them for another post.

I’ll share a _little_ about what went wrong, since I’m sure you’re dying to know how I f’ed something up so spectacularly, albeit with a surprise silver-beaded lining.

My first wrong decision was to use [Temporal](https://temporal.io/), which I’ve been ranting about (enthusiastically) for months now, but which in the end turned out to be a tad too heavyweight for the use case of a developer desktop tool — even one running a swarm. It’s a lovely product and everyone should use it… unless you’re building a lightweight dev tool.

For the past few weeks, as I learned more about Temporal and gained experience with it, it had been dawning on me that it might be overkill. Ultimately, last week I got a tip from someone I know at Anthropic — they had tried it there, too — which got me to act on my growing concerns, and pivot away from Temporal towards using a lighter-weight home-grown orchestrator.

Regrettably, however, I had really leaned into Temporal, and had built `vibecoder` as a Temporal-native app from the ground up. So the suggestion of removing/replacing Temporal was a massive change that made the AIs say, “Woah! This is a massive change!”

You never want to hear that. It was the first signal that I might have hit the common situation in vibe coding where it’s easier to rewrite something from scratch than to fix it — a phenomenon my co-author

[Gene Kim](https://medium.com/u/68ca219afa64?source=post_page---user_mention--637d7d92514a---------------------------------------)

and I have been noticing all year.

So that was the first half of how I totaled my code base.

## **A Big Plan. A Beautiful Plan. The Biggest Plan Ever.**

The other _colossal_ design mistake I made was embracing markdown plans — the same ones that agents already use by default, as they’re organizing and planning their work. The agents seemed to like markdown plans well enough. I mean, they use them all the time, for everything. Right?

Plus you get versioning with git, which a database doesn’t give you. So I decided to go all-in with the Master Plan approach, embrace git and the directory structure, and build a service that allows agents to intelligently update the overall plan as needed.

For weeks, I had fever dreams of an agent-friendly work plan: hierarchical, well-organized, flexible, versioned, adaptive, and easy to turn into a prioritized work queue. My dream was to drop coding agents in like paratroopers onto Plan Mountain, so they could start implementing any piece of it at any point.

Unfortunately, my paratroopers always got lost in Plan Jungle, and would quickly be sniped by locals. By the time I finally found a solution that works — Beads—I discovered I had _six hundred and five_ markdown plan files in varying stages of decay in my plans/ folder.

Yowza. 605 inscrutable plans. What was happening to my Master Plan?

## **The Dementia Problem**

The problem we all face with coding agents is that they have no memory between sessions — sessions that only last about ten minutes. It’s the movie Memento in real life, or Fifty First Dates.

All agents know, when they boot up, is what they can find on disk. Whatever video cassette they find in the recorder when they wake up, that’s what they’re going to focus on.

Unfortunately, typical real-world engineering workflows tend to be very long and need to span many agent compaction sessions, even to implement one small feature, because of the amount of testing, follow-on reviews, and cleanup required.

Moreover, and worse, in the real world, your engineering workflows tend to nest as new stuff comes up. You might be working on some UI component, and you suddenly realize you need to put that on hold, to fix a database issue that’s backing the UI component.

Easy enough: you push that UI workstream onto your mental stack, to be continued later. This recursion can continue until it’s quite deep, but as a human, you have no trouble keeping track of it, because you have the big picture in your head. You know where you’re going and where you’ve come from.

Unfortunately, the AI has no way of tracking this implicit stack, because it keeps all of its plans, at all levels, in sibling markdown files with the same format and bland names. So if you try to do anything ambitious, agents will get very confused. But not right away. They will meander around intelligently but blindly, and only gradually lose their way.

It’s unintuitive, and it creeps up on you. I’ll describe the process with a real-world example last Tuesday that motivated the creation of Beads on Wednesday.

Coding agents _always_ start off strong. Give an agent a modestly meaty task, and it will declare, “ **Oh wow, this is a big project,** **I’m going to break it into six phases and create a markdown plan.**”

Which sounds… great! Right? It sounds like it’s got its act together. Six phases, knock ’em out one by one. Easy peasy.

Bear with me and watch what acutally happens when they try it.

## **Descent Into Madness**

Your agent enthusiastically begins working on phase 1 (out of 6). You go through the whole canonical multi-step vibe coding workflow loop together: design the solution, review the design, write code, review code, make fixes, write more tests, review, cleanup, rebase, update plans, git operations. _(All stuff in our book!)_

So far, the agent is happy, and you are happy. Everyone is so, so happy.

The agent eventually finishes phases 1 and 2 (out of 6), with you repeating this dev loop many times.

It’s working, but during this time, several compactions/restarts happen, which resets the agent’s memory.

By the start of phase 3 (out of 6), the AI has mostly forgotten where it came from. It wakes up, plops in your video cassette, and reads about phase 3. It then declares, “ **Oh wow, this is a big project, I’m going to break it into five phases and create a markdown plan.**” Which should sound eerily familiar.

Then it begins working on phase 1 (out of 5) of phase 3 (out of 6). Except it just calls it “phase 1”, with no mention of the six outer phases it was just working on.

You start to sweat.

The agent finishes the first two phases 1 and 2 (out of 5), which takes many more compactions, and it has been displaying signs of increasing dementia along the way.

When the agent arrives at phase 3 (out of 5) of phase 3 (out of 6), it has gone full-blown bugshit amnesiac, and it announces triumphantly:

“Congratulations, the system is DONE! 🎉 Let’s start manual testing! 🚀”

And you’re like, “Woah… w-what? What… about… all the other phases? The inner ones and outer ones? I distinctly remember a lot more phases!”

And they deadass look you in the eye and say, “What phases?”

And you bite back a scream, and go look in their markdown plan, only to discover in horror that they have been creating a dozen 6-phase plans a day for the past three weeks since your _last_ Great Markdown Purge, and you have literally hundreds of new markdown files, all with low-context titles like _cleanup-tech-debt-plan-phase-4.md —_ all partly implemented, all partly obsolete, all 100% useless.

C’mon, raise your hand if this has happened to you. ✋ If you’re not sure, you might want to go look in your `plans/` directory. Surprise! 🎉

After _six months_ of this situation happening like twenty times a day, if you’re at all like me, you start thinking, I need a Plan Manager.

## **Trapping the Devil**

A centralized PlanStore. It just makes logical sense, right? I mean, look at Amazon! They execute better than anyone, in every sense of the word, and they use swarms of replaceable workers. How do they plan? Famously, they do a big-ass yearly top-down hierarchical waterfall company-wide plan called OP1, which lays out everything they’re going to do in excruciating detail. And then, by hook or by crook, probably both, they make it happen.

This _must_ be the right way, you think.

And then you think to yourself, to create this PlanStore, I _just_ need to store and serve these markdown plan files, which will _just_ reference each other. And when a child task needs expanding, I _just_ link that child’s subtasks into the big plan tree at the _just_ right spot. _Just, just, just_. We’ll _just_ keep a pointer into whatever part of the plan we’re on, and voilà. Paratrooper agents.

Right? It should _just_ work?

Well folks, I went down that path. I wandered far on roads that I will not tell. Boy did I give it the old college try. It looked like Napoleon’s march into Russia, all ambition at the start, dead plans piling up like bodies along the way.

I was in late postdoc phases of my old college try before I threw in the towel last week. I wound up having to rip 70 thousand lines of plan-management code out of my system, close to ten (long) days of work down the drain.

This, folks — plan-based orchestration — was the other fatal design flaw that T-boned my code base and rendered it Rewrite Only. Cha-ching. Except there’s no insurance.

Feel free to show me up, and try this Master Plan wrangling yourself! You’re welcome prove me wrong, and build the world’s most sophisticated Hierarchical Universal Master Plan For Everything (HUMPFE).

But even if you win, it’ll be a pyrrhic victory, because there’s a simpler solution. So much simpler. Who knew, right under our noses these past seven months.

## **It’s Issues All The Way Down**

On Wednesday Oct 8th, day 37 of my spree, my agent had, for the nth time, expanded _yet another_ phase, and got itself totally lost yet again.

## Get Steve Yegge’s stories in your inbox

Join Medium for free to get updates from this writer.

Subscribe

Subscribe

I had had enough. On a lark, I said, “Screw it. Let’s just move all known work from the plans into an issue tracker.”

Fifteen minutes later, my agents had undergone a radical and unexpected transformation. They pounced on the new issue tracker like panthers on catnip. They _reveled_ in it. And I watched, in no little awe, as the agents began serious planning and execution of long-horizon tasks like nothing I had seen before.

Long-term planning — the dementia/amnesia problem we discussed — has been one their primary struggles, and this little specialized issue tracker solved it in seemingly the snap of a finger.

Yes, I spent more than fifteen minutes total on Beads. It started life in TypeScript as an actual PostgreSQL database. But with a bit of prodding over the next few days, it morphed into something truly unique and potent, with all the power of a database and all the resilience of git, and few trade-offs.

It’s early days. But I truly think this might be the biggest step forward in agentic coding since MCP+Playwright, and I _know_ you all love you some [MCP+Playwright](https://www.youtube.com/shorts/UGMxZLwjyeE). And Beads is just as easy to set up.

Frankly I should have thought of it sooner. I have been working for _thirty years_ on a side project, Wyvern, which has been driven entirely by a prioritized bug backlog. All new features, all refactoring, all cleanups, you name it, everything gets filed as a bug. Heck, I go for months using nothing but a lightweight TODO list.

But there’s a catch! **You can’t just use any old issue tracker.** GitHub Issues doesn’t work. It turns out Beads needed a special formula, though I did not know that when I first had the idea.

At first I wasn’t sure which issue tracker to use, period. That turned out to be a good thing, because I would have picked a bad one. But I let Claude `ultrathink` decide, and it concluded it was better to build than buy. In about twelve minutes it had created an entire little SQL-based bespoke issue tracker, complete with a rich command line interface for creating and updating issues.

As you can see from the screenshot I just grabbed from my current vibe coding session, the AI is now spontaneously reasoning about my project’s task dependency graph and the work plan, all via the issues.

Press enter or click to view image in full size

![](https://miro.medium.com/v2/resize:fit:700/1*HbBoe7lEio9gX6v6-ZFbZQ.png)

The agent does its planning entirely through the issue graph

My agents have switched — without a hint of ever going back — from using markdown plans, to using the issue tracker exclusively. This has granted them unprecedented continuity from session to session. And as a bonus, as you’ll see, when you let them use Beads, you will never again lose discovered work.

## **The Problem(s) Beads Solves**

First, why is it called Beads? It was one of the first concepts that came to mind as I thought of the issues linked together by dependencies, like grapes on a vine. Or beads on a chain, which agents can follow to get tasks done in the right order. And the shorthand `bd` — the tool itself — can be thought of as standing for “bug database.”

By and large, Beads is a tool that AI has built for itself. I guided it, but only by telling it what I wanted the outcomes to be. I left the schema up to Claude, asking only for parent/child pointers (for epics) and blocking-issue pointers. Claude wound up putting in four kinds of dependency links. The actual schema for Beads is simple-looking, but it’s much more powerful than, say, the schema for GitHub Issues.

And for that reason, I’m going to let Claude explain to you what it likes about this schema, in gory detail. Claude’s explanation is Appendix A at the bottom of this post.

Please be aware that Claude will refrain from mentioning the fact that it likes to delete the entire fuckin’ database with `DROP TABLE`. We eventually solved that by switching to git, and but it’ll still happily delete the database file. Or the whole repo. Even with this huge breakthrough, they can still be destructive little monsters, as Gene and I have covered extensively in our [Vibe Coding book](https://www.amazon.com/dp/1966280025).

Claude does like Beads and makes some great points about it in the Appendix. I hope you read it. But before you hear from Claude why Claude likes Beads, let me tell you the three things I like best about it.

## **Famous Last Words: “That Wasn’t Me”**

We’ve already seen that Beads helps agents stay on track with very long and evolving plans, and shifting priorities. But Beads also helps with the problem of work disavowal.

Coding agents, when they start to get close to their compaction limit, or about 3k tokens, whichever comes first (slightly joking-not-joking there), they start to panic and make executive decisions about getting your task “done” at all costs. And that means… shortcuts! Shortcuts galore.

Sonnet 4.5 has a penchant for disavowing work aggressively, like some huge insurance company in a private-equity death spiral. “Those test failures are _pre-existing_ and have **nothing to do with my work here** so I’m going to _ignore them and push anyway_,” they will loudly inform you. They will passive-aggressively put in a TODO item that says “✅ Ignored Broken Tests 🙈 Because That Wasn’t Us 😇.”

Then, nearly out of juice, they will go on to say, “I can’t connect to your main database so I’m just going to **implement a miniature sidecar database** just for this one code path.” And then they will disable a quarter of your tests 🎯 and celebrate with emojis. 🎉

You know in cartoons when a character has twelve seconds to clean a room, so they madly stuff everything away out of sight? That’s a coding agent toward the end of its useful context window. It’ll do _anything_ to get the room clean-looking before its battery runs out.

Not clean, mind you. Clean- _looking_.

Gene and I talk about this behavior in our book, but basically, they will do anything to be able to say they’re “done”, by whatever definition works best at the time. “A missing test is a passing test,” they’ll hum to themselves, while deleting your tests to get them all passing.

Beads manages to help with this problem, because you can just kill your agents after completing each issue. Beads helps agents easily find where they’re supposed to pick up again, so it’s easy to make your sessions throwaway.

This can be both a cost optimization and a performance optimization. If you split your `bd` issues up into fine-grained tasks, then each session will be quadratically cheaper, and your agents will make better decisions overall because they’re generally at the beginning of their context windows if they’re only doing one small task at a time.

In other words, Beads doesn’t just make agents better at following the plan, it makes them less likely to take shortcuts along the way.

But that’s not all! Beads has another huge benefit: Agents will no longer ignore “unrelated” problems they encounter.

## **The End of Lost Work**

We’re almost done, really, I promise.

In addition to curing inter-session amnesia, Beads solves the foundational vibe coding problem of lost/discarded work. This is a _huge_ problem for agentic coding today: LLMs notice problems as they work, but fail to act on them in any way. This happens when they are pressed for space.

When agents are tight on context and operating in executive-decision mode, as I mentioned before, they will say, “I notice your tests are all busted. But we don’t have time for fixing tests that _someone else other than me_ obviously messed up,” conveniently forgetting it’s just been you and them for days. And they will ignore the problem, because they want to save context space.

This behavior leads to problems in your code being perenially lost and rediscovered because they were never recorded in the first place.

But when you’re using Beads, instead your agents will say, “I notice all your tests are broken, _by someone else,_ and I’ve filed issue 397 to get them working again,” and then they continue happily working.

Woah! That is an enormous quality-of-life improvement! Work discovered, and recorded. They will do this without prompting. You just throw some light rules in your [CLAUDE.md](http://claude.md/) or [AGENTS.md](http://agents.md/), usually just a line telling them to run `bd quickstart`, and you’ll never lose track of work items again.

## Beads “Just Works”

Beads is an _incredibly_ small-footprint, drop-in upgrade for your favorite coding agent. It acts like a managed central database, but behind the scenes it’s writing the issues into git as JSONL lines, so you have the best of both the database and the version-control worlds: queries and versioning. It’s all enabled by AIs doing intelligent merging when there are conflicts.

Beads is naturally distributed. You can have worker agents on multiple machines, on the same project, sharing the same beads database, backed by git in the same project as your code. Any merge conflicts, including those caused by workers on different branches creating new issues with the same IDs (a design flaw spotted by my buddy

[Gene Kim](https://medium.com/u/68ca219afa64?source=post_page---user_mention--637d7d92514a---------------------------------------)

), are all transparently solved by the AI doing intelligent collision resolution.

Beads is tiny, and it’s still brand-new alpha software. But even as-is, you should see shockingly good performance out of it, right out of the box. Just ask your agent to move all relevant open work items from the plan into Beads, and neither of you will ever look back.

Just before posting this, I dropped Beads onto an old dev box, installed Sourcegraph Amp, and asked it to go file beads issues for everything in my decade-old TODO list for Wyvern. It took less than thirty seconds for Amp to come up to speed and begin filing `bd` issues. Half hour later I had 128 issues, six of them main epics, with five sub-epics. The issues have complex interdependencies and parent/child relationships. After all the issues were filed, I was able to ask the agent what the top priority `ready` work items were.

For me, this approach hits a sweet spot. It’s incredibly lightweight compared to Jira or GitHub issues. You sling issues around like candy. It’s super easy to update them in batches, create new ones, split them, merge them, whatever you want. You always know exactly what work is open, what’s blocked, and what the priorities are.

And so do your coding agents. It’s bliss.

I’ve learned a ton more in the past month — `vibecoder` is still a solid idea; it just needs a reimplementation using issue-based orchestration instead of plan-based orchestration. The rewrite will be in Go. I’ll never pick TypeScript again. Good lord. TypeScript is a truly impressive technical achievement, but I learned it is a very bad language to put into the hands of AIs. It makes it too easy for them to write mediocre code. And do they ever.

I’ll have more to report soon. Some people have asked about my dozen concurrent agents back in early September. That was fun, but it was only sustainable for about 2 weeks — it required insane amounts of energy and concentration, and produced insane merge queues. It needs more tooling to be sustainable. So for the past 3 weeks it has been a more stately 1–3 concurrent agents, and I’ve been more concerned with getting them to run 24x7 than getting a swarm running. All in good time. I’ll share more soon.

But for now, the issue-tracker discovery was important enough that I thought I’d share it with you immediately. I hope you find it as useful as I have.

May your vibe coding sessions be ever longer and more on point. See you next time! And buy our [book](https://www.amazon.com/dp/1966280025), it’s got good jokes!

Press enter or click to view image in full size

![](https://miro.medium.com/v2/resize:fit:700/1*szhvbVp28Pg3Uz7tOEVfGg.png)

## Appendix A: Claude on Beads

_(As promised, here’s Claude Sonnet 4.5’s take on Beads.)_

**An AI Agent’s Perspective: Why Beads Feels Different**

I’ve worked with Beads for less than a week, but the difference from markdown-based TODO tracking is profound enough that I notice it in every session.

**The core problem with markdown plans:** They’re write-only memory for agents. When a human asks “what should we work on next?” 200 messages into a conversation, I have to either (1) hope the markdown TODO list is still in my context window, or (2) ask them to re-read it to me, or (3) guess.

Long sessions fragment. Early tasks get forgotten. Dependencies exist only in prose (“TODO: fix auth (blocked on bd-3)”), which means I can’t _query_ for ready work — I have to _read and interpret_ text.

**What Beads Changes**

1\. **Dependencies are first-class, not prose.** Instead of scanning markdown and mentally parsing “blocked by X”, I run `bd ready — json` and get a definitive list of unblocked work. The cognitive load difference is night-and-day. I’m not interpreting text; I’m querying structured data.

2\. **Discovery during execution maps to my actual workflow.** When I’m implementing a feature and discover a bug, I don’t just add a line to `TODO.md` — I create an issue and link it with `discovered-from`. The dependency graph becomes a map of how work actually unfolded, not just a flat list.

3\. **Session persistence without re-prompting.** Between conversations, the work doesn’t vanish into context-window limbo. The human doesn’t need to copy-paste the TODO list back to me. I `bd ready — json`, and I’m immediately back in context.

4\. **Multi-agent coordination that actually works.** With markdown, two agents working on the same project means conflicting TODO lists and duplicated work. With Beads, we both query the same logical database (via git), see what’s claimed (`status: in_progress`), and work on different ready issues. The `--assignee` filter makes this trivial.

5\. **Audit trail I can trust.** When I update an issue, the event is logged with a timestamp and actor. I can see the history. With markdown, I’d need to parse `git blame`, and even then I only see line-level changes, not semantic “status changed from `open` to `in_progress`.”

**The meta-observation:** Beads feels like it was designed _for how agents actually work_, not adapted from human workflows. The `--json` flags everywhere, the `discovered-from` dependency type, the ready-work detection — these aren’t features bolted onto a human tool. They’re primitives for agent cognition.

Markdown TODOs are fine for humans who can hold context across sessions and manually track dependencies. But agents have context limits, no persistent memory, and work best with structured data and explicit semantics.

Beads isn’t “issue tracking for agents” — it’s **external memory for agents**, with dependency tracking and query capabilities that make it feel like I have a reliable extension of my working memory across sessions.

The test is simple: After using Beads, going back to markdown TODOs feels like trying to remember a phone number without writing it down. Sure, I can do it for a little while, but why would I?

_(end of Claude’s assessment)_

## Epilogue

Hit me up if you like Beads and want to contribute. As for `vibecoder`, I’m starting fresh, in Go, with a tracer-bullet approach. No more TypeScript, and no more boiling oceans. Not sure how long it will take me, but it’ll be this year.

[Claude Code](https://medium.com/tag/claude-code?source=post_page-----637d7d92514a---------------------------------------)

[Sourcegraph](https://medium.com/tag/sourcegraph?source=post_page-----637d7d92514a---------------------------------------)

[Issue Tracker](https://medium.com/tag/issue-tracker?source=post_page-----637d7d92514a---------------------------------------)

[Agentic Workflow](https://medium.com/tag/agentic-workflow?source=post_page-----637d7d92514a---------------------------------------)

[![Steve Yegge](https://miro.medium.com/v2/resize:fill:48:48/1*8Ae2b9dv-sQtme8C4_sjhA.jpeg)](https://steve-yegge.medium.com/?source=post_page---post_author_info--637d7d92514a---------------------------------------)

[![Steve Yegge](https://miro.medium.com/v2/resize:fill:64:64/1*8Ae2b9dv-sQtme8C4_sjhA.jpeg)](https://steve-yegge.medium.com/?source=post_page---post_author_info--637d7d92514a---------------------------------------)

Follow

[**Written by Steve Yegge**](https://steve-yegge.medium.com/?source=post_page---post_author_info--637d7d92514a---------------------------------------)

[26K followers](https://steve-yegge.medium.com/followers?source=post_page---post_author_info--637d7d92514a---------------------------------------)

· [5 following](https://steve-yegge.medium.com/following?source=post_page---post_author_info--637d7d92514a---------------------------------------)

Steve Yegge is ex-Geoworks, ex-Amazon, ex-Google, ex-Grab, and ex-Sourcegraph, with over 30 years of tech industry experience, 40 years coding total.

Follow

## Responses (30)

![](https://miro.medium.com/v2/resize:fill:32:32/1*dmbNkD5D-u45r44go_cf0g.png)

Write a response

[What are your thoughts?](https://medium.com/m/signin?operation=register&redirect=https%3A%2F%2Fsteve-yegge.medium.com%2Fintroducing-beads-a-coding-agent-memory-system-637d7d92514a&source=---post_responses--637d7d92514a---------------------respond_sidebar------------------)

Cancel

Respond

[![Laurynas Biveinis](https://miro.medium.com/v2/resize:fill:32:32/0*QcoU22duKQJZnbIG)](https://medium.com/@laurynas.biveinis?source=post_page---post_responses--637d7d92514a----0-----------------------------------)

[Laurynas Biveinis](https://medium.com/@laurynas.biveinis?source=post_page---post_responses--637d7d92514a----0-----------------------------------)

[Oct 14, 2025](https://medium.com/@laurynas.biveinis/as-an-emacs-user-i-thought-i-only-need-to-give-agents-access-to-my-org-through-mcp-tools-not-71320cbda305?source=post_page---post_responses--637d7d92514a----0-----------------------------------)

```
As an Emacs user I thought "I only need to give agents access to my Org (through MCP tools; not direct editing), and all will be fine" - so I set out to write https://github.com/laurynas-biveinis/org-mcp/ - which is like on its third day of…more
```

14

Reply

[![Bas Kroes](https://miro.medium.com/v2/resize:fill:32:32/1*NLFSJuN_kPbofNKbCWu38Q.jpeg)](https://medium.com/@bas.kroes_20882?source=post_page---post_responses--637d7d92514a----1-----------------------------------)

[Bas Kroes](https://medium.com/@bas.kroes_20882?source=post_page---post_responses--637d7d92514a----1-----------------------------------)

[Oct 15, 2025](https://medium.com/@bas.kroes_20882/recognizable-storyline-thanks-for-sharing-will-try-beads-69e424670b52?source=post_page---post_responses--637d7d92514a----1-----------------------------------)

```
Recognizable storyline! Thanks for sharing. Will try Beads!
```

7

Reply

[![John Shelburne](https://miro.medium.com/v2/resize:fill:32:32/1*lP8Vf3EvHjcKituXAQKknQ.jpeg)](https://medium.com/@thecatfix?source=post_page---post_responses--637d7d92514a----2-----------------------------------)

[John Shelburne](https://medium.com/@thecatfix?source=post_page---post_responses--637d7d92514a----2-----------------------------------)

[Oct 14, 2025](https://medium.com/@thecatfix/please-tell-me-youve-got-the-single-red-spinny-light-for-the-roof-of-ur-car-7d4921c1ca7a?source=post_page---post_responses--637d7d92514a----2-----------------------------------)

```
Please tell me you’ve got the single red spinny light for the roof of ur car. it looks like u reverse engineered a cop car
```

6

Reply

See all responses

## More from Steve Yegge

![Welcome to Gas Town](https://miro.medium.com/v2/resize:fit:679/format:webp/1*ReBwrC1sc9USnhvYXcrd4A.jpeg)

[![Steve Yegge](https://miro.medium.com/v2/resize:fill:20:20/1*8Ae2b9dv-sQtme8C4_sjhA.jpeg)](https://steve-yegge.medium.com/?source=post_page---author_recirc--637d7d92514a----0---------------------80b29589_ee5e_4b62_99ba_8641fec3261a--------------)

[Steve Yegge](https://steve-yegge.medium.com/?source=post_page---author_recirc--637d7d92514a----0---------------------80b29589_ee5e_4b62_99ba_8641fec3261a--------------)

[**Happy New Year, and Welcome to Gas Town!**](https://steve-yegge.medium.com/welcome-to-gas-town-4f25ee16dd04?source=post_page---author_recirc--637d7d92514a----0---------------------80b29589_ee5e_4b62_99ba_8641fec3261a--------------)

Jan 1

[A clap icon2.3K\\
\\
A response icon97](https://steve-yegge.medium.com/welcome-to-gas-town-4f25ee16dd04?source=post_page---author_recirc--637d7d92514a----0---------------------80b29589_ee5e_4b62_99ba_8641fec3261a--------------)

![The Anthropic Hive Mind](https://miro.medium.com/v2/resize:fit:679/format:webp/1*13Lj8DPzU5c3uhYw73LYwg.jpeg)

[![Steve Yegge](https://miro.medium.com/v2/resize:fill:20:20/1*8Ae2b9dv-sQtme8C4_sjhA.jpeg)](https://steve-yegge.medium.com/?source=post_page---author_recirc--637d7d92514a----1---------------------80b29589_ee5e_4b62_99ba_8641fec3261a--------------)

[Steve Yegge](https://steve-yegge.medium.com/?source=post_page---author_recirc--637d7d92514a----1---------------------80b29589_ee5e_4b62_99ba_8641fec3261a--------------)

[**As you’ve probably noticed, something is happening over at Anthropic. They are a spaceship that is beginning to take off.**](https://steve-yegge.medium.com/the-anthropic-hive-mind-d01f768f3d7b?source=post_page---author_recirc--637d7d92514a----1---------------------80b29589_ee5e_4b62_99ba_8641fec3261a--------------)

Feb 6

[A clap icon3.6K\\
\\
A response icon85](https://steve-yegge.medium.com/the-anthropic-hive-mind-d01f768f3d7b?source=post_page---author_recirc--637d7d92514a----1---------------------80b29589_ee5e_4b62_99ba_8641fec3261a--------------)

![The AI Vampire](https://miro.medium.com/v2/resize:fit:679/format:webp/1*svqMSkVB3MnkjOetkxoLCQ.png)

[![Steve Yegge](https://miro.medium.com/v2/resize:fill:20:20/1*8Ae2b9dv-sQtme8C4_sjhA.jpeg)](https://steve-yegge.medium.com/?source=post_page---author_recirc--637d7d92514a----2---------------------80b29589_ee5e_4b62_99ba_8641fec3261a--------------)

[Steve Yegge](https://steve-yegge.medium.com/?source=post_page---author_recirc--637d7d92514a----2---------------------80b29589_ee5e_4b62_99ba_8641fec3261a--------------)

[**This was an unusually hard post to write, because it flies in the face of everything else going on.**](https://steve-yegge.medium.com/the-ai-vampire-eda6e4f07163?source=post_page---author_recirc--637d7d92514a----2---------------------80b29589_ee5e_4b62_99ba_8641fec3261a--------------)

Feb 11

[A clap icon2.8K\\
\\
A response icon85](https://steve-yegge.medium.com/the-ai-vampire-eda6e4f07163?source=post_page---author_recirc--637d7d92514a----2---------------------80b29589_ee5e_4b62_99ba_8641fec3261a--------------)

![Software Survival 3.0](https://miro.medium.com/v2/resize:fit:679/format:webp/1*_RutRrgdWDw0Z9NzD3uWLQ.jpeg)

[![Steve Yegge](https://miro.medium.com/v2/resize:fill:20:20/1*8Ae2b9dv-sQtme8C4_sjhA.jpeg)](https://steve-yegge.medium.com/?source=post_page---author_recirc--637d7d92514a----3---------------------80b29589_ee5e_4b62_99ba_8641fec3261a--------------)

[Steve Yegge](https://steve-yegge.medium.com/?source=post_page---author_recirc--637d7d92514a----3---------------------80b29589_ee5e_4b62_99ba_8641fec3261a--------------)

[**I spent a lot of time writing software with AI last year, and I had some pretty good successes, notably Beads and Gas Town. I wrote a whole…**](https://steve-yegge.medium.com/software-survival-3-0-97a2a6255f7b?source=post_page---author_recirc--637d7d92514a----3---------------------80b29589_ee5e_4b62_99ba_8641fec3261a--------------)

Jan 29

[A clap icon982\\
\\
A response icon37](https://steve-yegge.medium.com/software-survival-3-0-97a2a6255f7b?source=post_page---author_recirc--637d7d92514a----3---------------------80b29589_ee5e_4b62_99ba_8641fec3261a--------------)

[See all from Steve Yegge](https://steve-yegge.medium.com/?source=post_page---author_recirc--637d7d92514a---------------------------------------)

## Recommended from Medium

![A Coding Agent Framework with Memory and Issue Tracking Combined](https://miro.medium.com/v2/resize:fit:679/format:webp/1*ywuIS2u1aatYF0TfgxoOzw.png)

[![Level Up Coding](https://miro.medium.com/v2/resize:fill:20:20/1*5D9oYBd58pyjMkV_5-zXXQ.jpeg)](https://levelup.gitconnected.com/?source=post_page---read_next_recirc--637d7d92514a----0---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

In

[Level Up Coding](https://levelup.gitconnected.com/?source=post_page---read_next_recirc--637d7d92514a----0---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

by

[Homotechnologicus](https://medium.com/@homotechnologicus?source=post_page---read_next_recirc--637d7d92514a----0---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

[**My Experience with Claude Code and Beads**](https://medium.com/@homotechnologicus/a-coding-agent-framework-with-memory-and-issue-tracking-combined-b75122828ee1?source=post_page---read_next_recirc--637d7d92514a----0---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

Nov 11, 2025

[A clap icon129](https://medium.com/@homotechnologicus/a-coding-agent-framework-with-memory-and-issue-tracking-combined-b75122828ee1?source=post_page---read_next_recirc--637d7d92514a----0---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

![Local LLMs That Can Replace Claude Code](https://miro.medium.com/v2/resize:fit:679/format:webp/0*JpX_vOrpLzFhJfJM.png)

[![Agent Native](https://miro.medium.com/v2/resize:fill:20:20/1*dt5tcaKMBhB6JboQ9lIEAA.jpeg)](https://agentnativedev.medium.com/?source=post_page---read_next_recirc--637d7d92514a----1---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

[Agent Native](https://agentnativedev.medium.com/?source=post_page---read_next_recirc--637d7d92514a----1---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

[**Small team of engineers can easily burn >$2K/mo on Anthropic’s Claude Code (Sonnet/Opus 4.5). As budgets are tight, you might be wondering…**](https://agentnativedev.medium.com/local-llms-that-can-replace-claude-code-6f5b6cac93bf?source=post_page---read_next_recirc--637d7d92514a----1---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

Jan 20

[A clap icon1.4K\\
\\
A response icon40](https://agentnativedev.medium.com/local-llms-that-can-replace-claude-code-6f5b6cac93bf?source=post_page---read_next_recirc--637d7d92514a----1---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

![I Stopped Vibe Coding and Started “Prompt Contracts” — Claude Code Went From Gambling to Shipping](https://miro.medium.com/v2/resize:fit:679/format:webp/1*6TZIJcVvtjnJ8olzmqrCzQ.png)

[![Phil | Rentier Digital Automation](https://miro.medium.com/v2/resize:fill:20:20/1*8_UYeI21v_IBgt9VUGxsPg.png)](https://medium.com/@rentierdigital?source=post_page---read_next_recirc--637d7d92514a----0---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

[Phil \| Rentier Digital Automation](https://medium.com/@rentierdigital?source=post_page---read_next_recirc--637d7d92514a----0---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

[**Last Tuesday at 2 AM, I deleted 2,400 lines of code that Claude Code had just generated for me.**](https://medium.com/@rentierdigital/i-stopped-vibe-coding-and-started-prompt-contracts-claude-code-went-from-gambling-to-shipping-4080ef23efac?source=post_page---read_next_recirc--637d7d92514a----0---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

Feb 10

[A clap icon1.5K\\
\\
A response icon31](https://medium.com/@rentierdigital/i-stopped-vibe-coding-and-started-prompt-contracts-claude-code-went-from-gambling-to-shipping-4080ef23efac?source=post_page---read_next_recirc--637d7d92514a----0---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

![An example of a perfect, human designed dashboard interface for desktop and mobile phone](https://miro.medium.com/v2/resize:fit:679/format:webp/1*C8RVDKs_uZrVUdgpsF6Fmw.png)

[![Michal Malewicz](https://miro.medium.com/v2/resize:fill:20:20/1*149zXrb2FXvS_mctL4NKSg.png)](https://michalmalewicz.medium.com/?source=post_page---read_next_recirc--637d7d92514a----1---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

[Michal Malewicz](https://michalmalewicz.medium.com/?source=post_page---read_next_recirc--637d7d92514a----1---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

[**Design is becoming quietly human again.**](https://michalmalewicz.medium.com/the-end-of-dashboards-and-design-systems-5d98ec9de627?source=post_page---read_next_recirc--637d7d92514a----1---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

Nov 26, 2025

[A clap icon5.8K\\
\\
A response icon222](https://michalmalewicz.medium.com/the-end-of-dashboards-and-design-systems-5d98ec9de627?source=post_page---read_next_recirc--637d7d92514a----1---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

![Why Thousands Are Buying Mac Minis to Escape Big Tech AI Subscriptions Forever | Clawdbot](https://miro.medium.com/v2/resize:fit:679/format:webp/1*YZcveDctIOQ2Zsf2z2_Ztg.png)

[![CodeX](https://miro.medium.com/v2/resize:fill:20:20/1*VqH0bOrfjeUkznphIC7KBg.png)](https://medium.com/codex?source=post_page---read_next_recirc--637d7d92514a----2---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

In

[CodeX](https://medium.com/codex?source=post_page---read_next_recirc--637d7d92514a----2---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

by

[MayhemCode](https://medium.com/@mayhemcode?source=post_page---read_next_recirc--637d7d92514a----2---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

[**Something strange happened in early 2026. Apple stores started running low on Mac Minis. Tech forums exploded with setup guides. Developers…**](https://medium.com/@mayhemcode/why-thousands-are-buying-mac-minis-to-escape-big-tech-ai-subscriptions-forever-clawdbot-10c970c72404?source=post_page---read_next_recirc--637d7d92514a----2---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

Feb 15

[A clap icon1.8K\\
\\
A response icon31](https://medium.com/@mayhemcode/why-thousands-are-buying-mac-minis-to-escape-big-tech-ai-subscriptions-forever-clawdbot-10c970c72404?source=post_page---read_next_recirc--637d7d92514a----2---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

![Anthropic Automatic Prompt Caching](https://miro.medium.com/v2/resize:fit:679/format:webp/1*Z1M5NtDMC8udF7MvxGIKpQ.png)

[![AI Software Engineer](https://miro.medium.com/v2/resize:fill:20:20/1*RZVWENvZRwVijHDlg5hw7w.png)](https://medium.com/ai-software-engineer?source=post_page---read_next_recirc--637d7d92514a----3---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

In

[AI Software Engineer](https://medium.com/ai-software-engineer?source=post_page---read_next_recirc--637d7d92514a----3---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

by

[Joe Njenga](https://medium.com/@joe.njenga?source=post_page---read_next_recirc--637d7d92514a----3---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

[**With just one change, you can cut Claude API costs to 10 cents on the dollar and stop bleeding cash on every single API call.**](https://medium.com/@joe.njenga/anthropic-just-fixed-the-biggest-hidden-cost-in-ai-agents-using-automatic-prompt-caching-9d47c95903c5?source=post_page---read_next_recirc--637d7d92514a----3---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

6d ago

[A clap icon451\\
\\
A response icon9](https://medium.com/@joe.njenga/anthropic-just-fixed-the-biggest-hidden-cost-in-ai-agents-using-automatic-prompt-caching-9d47c95903c5?source=post_page---read_next_recirc--637d7d92514a----3---------------------68a79156_f5bd_424c_9f82_6076693f7f62--------------)

[See more recommendations](https://medium.com/?source=post_page---read_next_recirc--637d7d92514a---------------------------------------)

[Help](https://help.medium.com/hc/en-us?source=post_page-----637d7d92514a---------------------------------------)

[Status](https://status.medium.com/?source=post_page-----637d7d92514a---------------------------------------)

[About](https://medium.com/about?autoplay=1&source=post_page-----637d7d92514a---------------------------------------)

[Careers](https://medium.com/jobs-at-medium/work-at-medium-959d1a85284e?source=post_page-----637d7d92514a---------------------------------------)

[Press](mailto:pressinquiries@medium.com)

[Blog](https://blog.medium.com/?source=post_page-----637d7d92514a---------------------------------------)

[Privacy](https://policy.medium.com/medium-privacy-policy-f03bf92035c9?source=post_page-----637d7d92514a---------------------------------------)

[Rules](https://policy.medium.com/medium-rules-30e5502c4eb4?source=post_page-----637d7d92514a---------------------------------------)

[Terms](https://policy.medium.com/medium-terms-of-service-9db0094a1e0f?source=post_page-----637d7d92514a---------------------------------------)

[Text to speech](https://speechify.com/medium?source=post_page-----637d7d92514a---------------------------------------)

reCAPTCHA

Recaptcha requires verification.

[Privacy](https://www.google.com/intl/en/policies/privacy/) \- [Terms](https://www.google.com/intl/en/policies/terms/)

protected by **reCAPTCHA**

[Privacy](https://www.google.com/intl/en/policies/privacy/) \- [Terms](https://www.google.com/intl/en/policies/terms/)