export interface RobotCharacter {
  id: string;
  name: string;
  iconDefault: string;
  iconSelected: string;
  nameAudio?: string;
  greetingAudio?: string;
  greetingPoses?: string[];
  poses: {
    idle: string;
    blink: string;
    empathy: string;
    celebrate_left: string;
    celebrate_right: string;
    celebrate_both: string;
    talk: string;
    thumbs_up: string;
    talk_a?: string;
    talk_b?: string;
    hands_out?: string;
    hello?: string;
    arms_out?: string;
    idle02?: string;
    idle03?: string;
    celebrate01?: string;
    celebrate02?: string;
    celebrate03?: string;
    celebrate04?: string;
    arms_out02?: string;
    arms_out03?: string;
    hands?: string;
  };
}

// Voice ID mapping for ElevenLabs text-to-speech
export const robotVoiceMap: Record<string, string> = {
  'reflekto': 'XepZtHBsTiZjHKBvm6XL', // Current working voice
  'ecko': 'dWZ2msfizjlS6mcNsoyl',
  'loomi': 'O2BjpBQdTvx65MeIwCI7',
  'zeno': 'itLhaUpBHueh3c0lCY4o',
  'melo': '7VeZ2GTPGZ8OB5LwDgSw',
  'blinq': 'li7UxPFFk0kpwkrfiNyM'
};

export const allRobots: RobotCharacter[] = [
  {
    id: 'reflekto',
    name: 'Reflekto',
    iconDefault: '/Icons/Reflekto-Icon.webp',
    iconSelected: '/Icons/Reflekto-Icon-02.webp',
    nameAudio: '/audio/bot-names/reflekto-name.mp3',
    greetingAudio: '/audio/bot-greetings/reflekto-greeting.mp3',
    greetingPoses: [
      '/characters/reflekto/Reflekto-bot-01-talk.webp',
      '/characters/reflekto/Reflekto-bot-01-celebrate_left.webp',
      '/characters/reflekto/Reflekto-bot-01-blink.webp',
      '/characters/reflekto/Reflekto-bot-01-celebrate_both.webp',
      '/characters/reflekto/Reflekto-bot-01-thumbs-Up.webp'
    ],
    poses: {
      idle: '/characters/reflekto/Reflekto-bot-01-idle.webp',
      blink: '/characters/reflekto/Reflekto-bot-01-blink.webp',
      empathy: '/characters/reflekto/Reflekto-bot-01-empathy.webp',
      celebrate_left: '/characters/reflekto/Reflekto-bot-01-celebrate_left.webp',
      celebrate_right: '/characters/reflekto/Reflekto-bot-01-celebrate_right.webp',
      celebrate_both: '/characters/reflekto/Reflekto-bot-01-celebrate_both.webp',
      talk: '/characters/reflekto/Reflekto-bot-01-talk.webp',
      thumbs_up: '/characters/reflekto/Reflekto-bot-01-thumbs-Up.webp'
    }
  },
  {
    id: 'ecko',
    name: 'Ecko',
    iconDefault: '/Icons/Ecko-Icon.webp',
    iconSelected: '/Icons/Ecko-Icon-02.webp',
    nameAudio: '/audio/bot-names/ecko-name.mp3',
    greetingAudio: '/audio/bot-greetings/ecko-greeting.mp3',
    greetingPoses: [
      '/characters/ecko/Ecko-BOT-02-arms-out.webp',
      '/characters/ecko/Ecko-BOT-02-celebrate-right.webp',
      '/characters/ecko/Ecko-BOT-02-blink.webp'
    ],
    poses: {
      idle: '/characters/ecko/Ecko-BOT-02-idle.webp',
      blink: '/characters/ecko/Ecko-BOT-02-blink.webp',
      empathy: '/characters/ecko/Ecko-BOT-02-idle02.webp',
      celebrate_left: '/characters/ecko/Ecko-BOT-02-celebrate-left.webp',
      celebrate_right: '/characters/ecko/Ecko-BOT-02-celebrate-right.webp',
      celebrate_both: '/characters/ecko/Ecko-BOT-02-arms-out.webp',
      talk: '/characters/ecko/Ecko-BOT-02-idle02.webp',
      thumbs_up: '/characters/ecko/Ecko-BOT-02-arms-out.webp',
      talk_a: '/characters/ecko/Ecko-BOT-02-idle02.webp',
      arms_out: '/characters/ecko/Ecko-BOT-02-arms-out.webp',
      idle02: '/characters/ecko/Ecko-BOT-02-idle02.webp'
    }
  },
  {
    id: 'loomi',
    name: 'Loomi',
    iconDefault: '/Icons/Loomi-Icon.webp',
    iconSelected: '/Icons/Loomi-Icon-02.webp',
    nameAudio: '/audio/bot-names/loomi-name.mp3',
    greetingAudio: '/audio/bot-greetings/loomi-greeting.mp3',
    greetingPoses: [
      '/characters/loomi/Loomi-BOT-03-celebrate02.webp',
      '/characters/loomi/Loomi-BOT-03-celebrate03.webp',
      '/characters/loomi/Loomi-BOT-03-blink.webp'
    ],
    poses: {
      idle: '/characters/loomi/Loomi-BOT-03-idle.webp',
      blink: '/characters/loomi/Loomi-BOT-03-blink.webp',
      empathy: '/characters/loomi/Loomi-BOT-03-idle02.webp',
      celebrate_left: '/characters/loomi/Loomi-BOT-03-celebrate01.webp',
      celebrate_right: '/characters/loomi/Loomi-BOT-03-celebrate02.webp',
      celebrate_both: '/characters/loomi/Loomi-BOT-03-celebrate03.webp',
      talk: '/characters/loomi/Loomi-BOT-03-idle02.webp',
      thumbs_up: '/characters/loomi/Loomi-BOT-03-celebrate04.webp',
      talk_a: '/characters/loomi/Loomi-BOT-03-idle02.webp',
      talk_b: '/characters/loomi/Loomi-BOT-03-idle03.webp',
      celebrate01: '/characters/loomi/Loomi-BOT-03-celebrate01.webp',
      celebrate02: '/characters/loomi/Loomi-BOT-03-celebrate02.webp',
      celebrate03: '/characters/loomi/Loomi-BOT-03-celebrate03.webp',
      celebrate04: '/characters/loomi/Loomi-BOT-03-celebrate04.webp',
      idle02: '/characters/loomi/Loomi-BOT-03-idle02.webp',
      idle03: '/characters/loomi/Loomi-BOT-03-idle03.webp'
    }
  },
  {
    id: 'melo',
    name: 'Melo',
    iconDefault: '/Icons/Melo-Icon.webp',
    iconSelected: '/Icons/Melo-Icon-02.webp',
    nameAudio: '/audio/bot-names/melo-name.mp3',
    greetingAudio: '/audio/bot-greetings/melo-greeting.mp3',
    greetingPoses: [
      '/characters/melo/Melo-BOT-04-hello.webp',
      '/characters/melo/Melo-BOT-04-hands-out.webp',
      '/characters/melo/Melo-BOT-04-blink.webp'
    ],
    poses: {
      idle: '/characters/melo/Melo-BOT-04-idle.webp',
      blink: '/characters/melo/Melo-BOT-04-blink.webp',
      empathy: '/characters/melo/Melo-BOT-04-hands.webp',
      celebrate_left: '/characters/melo/Melo-BOT-04-celebrate01.webp',
      celebrate_right: '/characters/melo/Melo-BOT-04-celebrate02.webp',
      celebrate_both: '/characters/melo/Melo-BOT-04-thumbs-up.webp',
      talk: '/characters/melo/Melo-BOT-04-hands.webp',
      thumbs_up: '/characters/melo/Melo-BOT-04-thumbs-up.webp',
      talk_a: '/characters/melo/Melo-BOT-04-hands.webp',
      talk_b: '/characters/melo/Melo-BOT-04-hands-out.webp',
      hands_out: '/characters/melo/Melo-BOT-04-hands-out.webp',
      hello: '/characters/melo/Melo-BOT-04-hello.webp',
      hands: '/characters/melo/Melo-BOT-04-hands.webp',
      celebrate01: '/characters/melo/Melo-BOT-04-celebrate01.webp',
      celebrate02: '/characters/melo/Melo-BOT-04-celebrate02.webp'
    }
  },
  {
    id: 'blinq',
    name: 'Blinq',
    iconDefault: '/Icons/Blinq-Icon.webp',
    iconSelected: '/Icons/Blinq-Icon-02.webp',
    nameAudio: '/audio/bot-names/blinq-name.mp3',
    greetingAudio: '/audio/bot-greetings/blinq-greeting.mp3',
    greetingPoses: [
      '/characters/blinq/Blinq-BOT-05-hello.webp',
      '/characters/blinq/Blinq-BOT-05-talk-b.webp',
      '/characters/blinq/Blinq-BOT-05-blink.webp'
    ],
    poses: {
      idle: '/characters/blinq/Blinq-BOT-05-idle.webp',
      blink: '/characters/blinq/Blinq-BOT-05-blink.webp',
      empathy: '/characters/blinq/Blinq-BOT-05-idle02.webp',
      celebrate_left: '/characters/blinq/Blinq-BOT-05-celebrate01.webp',
      celebrate_right: '/characters/blinq/Blinq-BOT-05-celebrate02.webp',
      celebrate_both: '/characters/blinq/Blinq-BOT-05-hello.webp',
      talk: '/characters/blinq/Blinq-BOT-05-talk-a.webp',
      thumbs_up: '/characters/blinq/Blinq-BOT-05-hello.webp',
      talk_a: '/characters/blinq/Blinq-BOT-05-talk-a.webp',
      talk_b: '/characters/blinq/Blinq-BOT-05-talk-b.webp',
      hello: '/characters/blinq/Blinq-BOT-05-hello.webp',
      idle02: '/characters/blinq/Blinq-BOT-05-idle02.webp',
      celebrate01: '/characters/blinq/Blinq-BOT-05-celebrate01.webp',
      celebrate02: '/characters/blinq/Blinq-BOT-05-celebrate02.webp'
    }
  },
  {
    id: 'zeno',
    name: 'Zeno',
    iconDefault: '/Icons/Zeno-Icon.webp',
    iconSelected: '/Icons/Zeno-Icon-02.webp',
    nameAudio: '/audio/bot-names/zeno-name.mp3',
    greetingAudio: '/audio/bot-greetings/zeno-greeting.mp3',
    greetingPoses: [
      '/characters/zeno/Zeno-BOT-06-talk-b.webp',
      '/characters/zeno/Zeno-BOT-06-arms-out03.webp',
      '/characters/zeno/Zeno-BOT-06-blink.webp'
    ],
    poses: {
      idle: '/characters/zeno/Zeno-BOT-06-idle.webp',
      blink: '/characters/zeno/Zeno-BOT-06-blink.webp',
      empathy: '/characters/zeno/Zeno-BOT-06-arms-out.webp',
      celebrate_left: '/characters/zeno/Zeno-BOT-06-arms-out02.webp',
      celebrate_right: '/characters/zeno/Zeno-BOT-06-arms-out03.webp',
      celebrate_both: '/characters/zeno/Zeno-BOT-06-celebrate.webp',
      talk: '/characters/zeno/Zeno-BOT-06-talk-a.webp',
      thumbs_up: '/characters/zeno/Zeno-BOT-06-celebrate.webp',
      talk_a: '/characters/zeno/Zeno-BOT-06-talk-a.webp',
      talk_b: '/characters/zeno/Zeno-BOT-06-talk-b.webp',
      arms_out: '/characters/zeno/Zeno-BOT-06-arms-out.webp',
      arms_out02: '/characters/zeno/Zeno-BOT-06-arms-out02.webp',
      arms_out03: '/characters/zeno/Zeno-BOT-06-arms-out03.webp',
      celebrate: '/characters/zeno/Zeno-BOT-06-celebrate.webp'
    }
  }
];

export const getRobotById = (id: string): RobotCharacter | undefined => {
  return allRobots.find(robot => robot.id === id);
};