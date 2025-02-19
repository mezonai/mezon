const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');
const Colors = require('../../libs/ui/src/lib/Variables/Colors');
const topBarHeight = '60px';
const chatBoxHeight = '52px';
const chatBoxHeightThread = '60px';
const clanWidth = '72px';
const channelListWidth = '272px';
const memberWidth = '245px';
const memberWidthThread = '500px';
const avatarWidth = '68px';
const widthModalSearch = '400px';
const widthResultSearch = '420px';
const heightModalSearch = '300px';
const dmProfileWidth = '340px'
const iconWidth = '160px';
const titleBarHeight = '21px';
  const heightMessageViewChat = `calc(100vh - 10px - ${topBarHeight} - ${chatBoxHeight})`;
const heightMessageViewChatMobile = `calc(100vh - 10px - ${chatBoxHeight})`;
const heightMessageViewChatDM = `calc(100vh - 60px - ${topBarHeight})`;
const heightMessageViewChatThread = `calc(100vh - 10px - ${topBarHeight} - ${chatBoxHeightThread})`;
const heightWithoutTopBar = `calc(100vh - ${topBarHeight})`;
const heightWithoutTopBarMobile = `calc(100vh)`;
const heightCallDm = `calc(100% - 240px)`;
const messageViewChatDM = `calc(100vh - 60px)`;

const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'),
    'node_modules/flowbite-react/lib/esm/**/*.js',
    ...createGlobPatternsForDependencies(__dirname),
  ],
  darkMode: 'class',

  theme: {
    extend: {
      flex: {
        '1': '1 1 0%',
        '2': '2 1 0%',
        '3': '3 1 0%',
        '4': '4 1 0%',
      },
      backgroundImage: {
        'gradient-to-r': 'linear-gradient(to right, var(--tw-gradient-stops))',
      },
      typography: {
        sm: {
          css: {
            color: '#ccc',
            fontSize: '15px',
          },
        },
      },
      spacing: {
        px: '1px',
        0: '0',
        96: '96px',
        210: '210px',
        250: '250px',
      },
      width: {
        // widthWithoutServerWidth: `calc(100vw - ${topBarHeight})`,
        widthMessageViewChat: `calc(100vw - ${clanWidth} - ${channelListWidth} - ${memberWidth})`,
        widthMessageViewChatThread: `calc(100vw - ${clanWidth} - ${channelListWidth} - ${memberWidthThread})`,
        widthMessageWithUser: `calc(100vw - ${clanWidth} - ${channelListWidth} - ${memberWidth} - ${avatarWidth})`,
        widChatBoxBreak: `calc(100vw - ${clanWidth} - ${channelListWidth} - ${memberWidth} - ${iconWidth})`,
        widthMessageTextChat: `calc(100% - 40px)`,
        widthChannelTypeText: `calc(100% - 10px)`,
        widthSideBar: `calc(100vw - 72px)`,
        widthHeader: `calc(100% - 344px)`,
        widthMemberList: memberWidth,
        widthNoMemberList: memberWidth,
        widthThumnailAttachment: `calc(100vw - ${clanWidth} - ${channelListWidth})`,
        widthSearchMessage: `calc(100vw - ${clanWidth} - ${channelListWidth} - ${widthResultSearch})`,
        widthModalSearch: widthModalSearch,
        widthPinMess: `calc(100% - 16px)`,
        widthInputViewChannelPermission: `calc(100% - 30px)`,
        widthDmProfile: dmProfileWidth,
        450: '450px',
        "4/5": "80%",
        "9/10": "90%",
        widthTitleBar: '100%'
      },
      height: {
        heightMessageViewChat: heightMessageViewChat,
        heightMessageViewChatMobile: heightMessageViewChatMobile,
        heightMessageViewChatDM: heightMessageViewChatDM,
        heightMessageViewChatThread: heightMessageViewChatThread,
        heightWithoutTopBar: heightWithoutTopBar,
        heightWithoutTopBarMobile: heightWithoutTopBarMobile,
        heightTopBar: topBarHeight,
        heightCallDm: heightCallDm,
        heightChatBox: chatBoxHeight,
        heightModalSearch: heightModalSearch,
        heightHeader: "60px",
        "9/10": "90%",
        heightTitleBar: `calc(100vh - ${titleBarHeight})`,
        heightTitleBarMessageViewChat: `calc(${heightMessageViewChat} - ${titleBarHeight})`,
        heightTitleBarMessageViewChatMobile: `calc(${heightMessageViewChatMobile} - ${titleBarHeight})`,
        heightTitleBarMessageViewChatDM: `calc(${heightMessageViewChatDM} - ${titleBarHeight})`,
        heightTitleBarMessageViewChatThread: `calc(${heightMessageViewChatThread} - ${titleBarHeight})`,
        heightTitleBarWithoutTopBar: `calc(${heightWithoutTopBar} - ${titleBarHeight})`,
        heightTitleBarWithoutTopBarMobile: `calc(${heightWithoutTopBarMobile} - ${titleBarHeight})`
      },

      maxWidth: {
        '9/10': '90%',
        '2/5': "40%",
        boxChatView: `calc(100vw - 589px)`,
        wrappBoxChatView: `calc(100vw - 377px)`,
        wrappBoxChatViewMobile: `calc(100vw)`,
      },

      maxHeight: {
        '4/5': '80%',
        '9/10': "90%",
        heightInBox: `calc(100vh - 168px)`,
        messageViewChatDM: messageViewChatDM,
        titleBarMessageViewChatDM: `calc(${messageViewChatDM} - ${titleBarHeight})`,
        listMemberRole: `calc(100vh - 225px)`,
        "50vh": "50vh"
      },

      minHeight: {
        600: '600px',
        heightModalSearch: heightModalSearch,
        heightRolesEdit: `calc(100% - 60px)`,
        heightRolesEditMobile: `calc(100% - 10px)`,
      },

      minWidth: {
        widthMenuMobile: `calc(100vw - ${clanWidth})`,
      },

      fontFamily: {
        ggSans: ['gg sans', 'sans-serif'],
      },
      screens: {
        'mobile-s': '320px',
        'mobile-l': '375px',
      },
      fontSize: {
        header: ['5rem', '5rem'],
        headerMobile: ['3.125rem', '3.75rem'],
        subHeaderMobile: '1.563rem',
        contentMobile: '1.25rem',
      },
      colors: Colors,
      transitionDuration: {
        3000: '3000ms',
      },
      keyframes: {
        rotation: {
          '0%': {
            transform: 'rotate3d(0, 1, 0, 0deg)',
          },
          '50%': {
            transform: 'rotate3d(0, 1, 0, 180deg)',
          },
          '100%': {
            transform: 'rotate3d(0, 1, 0, 360deg)',
          },
        },
        faded_input: {
          '0%': {
            opacity: 0.80,
          },
          '100%': {
            opacity: 1,
          },
        },
        scale_up: {
          '0%': {
            opacity: 0.5,
            transform: 'scale(0.8,0.8)'
          },
          '50%': {
            opacity: 1
          },
          '100%': {
            transform: "scale(1)"
          }
        },
        scale_down: {
          '0%': {
            transform: "scale(1)",
            opacity: 1
          },
          '100%': {
            opacity: 0,
            transform: 'scale(0,0)'
          }
        },
        height_logo:{
          from : {
            height:'0px'
          },
          to : {
            height:'60px'
          }
        },
        move_out_logo : {
          from : {
            height:'60px'
          },
          to : {
            height:'0px'
          }
        },
        fly_in: {
          '0%': {
            opacity: 0.5,
            transform: 'translateX(20px)'
          },
          '50%': {
            opacity: 1
          },
          '100%': {
            transform: 'translateX(0px)'
          }
        },
        slide_in: {
          '0%': {
            transform: 'translateX(120px)',
            opacity: 0.7
          },
          '100%': {
            transform: 'translateX(0px)',
            opacity: 1
          }
        },
        pulse: {
          '50%': {
            opacity: 0.5
          }
        },
        move_down: {
          '0%': { transform: 'translateY(-20px)', opacity: '0.8' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        wiggle : {
          '0%, 7%' : {
            transform: 'rotateZ(0)'
          },
          '15%': {
            transform: 'rotateZ(-20deg)'
          },
          '20%': {
            transform: 'rotateZ(15deg)'
          },
          '25%': {
            transform: 'rotateZ(-15deg)'
          },
          '30%': {
            transform: 'rotateZ(11deg)'
          },
          '35%': {
            transform: 'rotateZ(-9deg)'
          },
          '40%, 100%': {
            transform: 'rotateZ(0)'
          }
        }
      },
      boxShadow: {
        'emoji_item': '0 1px 0 0 #ededef',
        'emoji_item_dark': '0 1px 0px 0px #3e3e3ed4',
        'emoji_item-delete': '0px 0px 2.5px 0px #2f2f2f33',
        'shadowInbox': '0 0 0 1px hsla(0, 0%, 0%, 0.08)',
        'shadowBorder': '0 0 0 1px hsla(0, 0%, 100%, 0.08)'
      }
    },
    animation: {
      rotation: 'rotation 6s linear infinite',
      spin: 'spin 1s linear infinite',
      faded_input: 'faded_input 0.05s ease-in-out forwards',
      scale_up: 'scale_up 0.2s ease-in-out forwards',
      scale_down : 'scale_down 0.2s ease-in-out forwards',
      height_logo: 'height_logo 0.2s ease-in-out forwards',
      move_out_logo: 'move_out_logo 0.2s ease-in-out forwards',
      fly_in: 'fly_in 0.2s ease-in-out forwards',
      slide_in: 'slide_in 0.5s ease-in-out forwards',
      pulse: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      move_down: 'move_down 0.5s forwards',
      wiggle : 'wiggle 2s linear forwards'
    },
    screens: {
      ssm: "430px",
      sbm: "480px",
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      const newUtilities = {
        '.hide-scrollbar::-webkit-scrollbar': {
          display: 'none',
        },
        '.overflow-anchor-none': {
          'overflow-anchor': 'none'
        },
        '.overflow-anchor-auto': {
          'overflow-anchor': 'auto'
        }
      };
      addUtilities(newUtilities, ['responsive', 'hover']);
    }),
    require('@tailwindcss/typography'),
  ],
  //   plugins: [require('flowbite/plugin')],
};
