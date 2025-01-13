import { AvatarImage, GifStickerEmojiPopup, MemberProfile, MessageBox, SearchMessageChannel, StatusFriend } from '@mezon/components';
import { useAppNavigation, useDirect, useGifsStickersEmoji } from '@mezon/core';
import { messagesActions, selectCloseMenu, selectCurrentUserDM, selectFriendStatus, selectPositionEmojiButtonSmile, selectStatusMenu, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EmojiPlaces, IMessageSendPayload, MentionDataProps, SubPanelName, ThreadValue, createImgproxyUrl, isLinuxDesktop, isWindowsDesktop } from '@mezon/utils';
import Tippy from '@tippy.js/react';
import { ChannelStreamMode } from 'mezon-js';
import { ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

const DirectMessageTemporary = () => {
  // TODO: move selector to store
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { navigate, toDmGroupPage } = useAppNavigation();
  const dispatch = useAppDispatch();
  const { createDirectMessageWithUser } = useDirect();
  const { subPanelActive } = useGifsStickersEmoji();
  const closeMenu = useSelector(selectCloseMenu);
  const statusMenu = useSelector(selectStatusMenu);
  const positionOfSmileButton = useSelector(selectPositionEmojiButtonSmile);
  const currentUserDM = useSelector(selectCurrentUserDM);
  const checkAddFriend = useSelector(currentUserDM ? selectFriendStatus(currentUserDM.id || '') : () => 4);
  useEffect(() => {
    if (!currentUserDM || Object.keys(currentUserDM).length === 0) {
      navigate('/chat/direct/friends');
    }
  }, [currentUserDM, navigate]);

  if (!currentUserDM) {
    return null;
  }

  const HEIGHT_EMOJI_PANEL = 457;
  const WIDTH_EMOJI_PANEL = 500;

  const distanceToBottom = window.innerHeight - positionOfSmileButton.bottom;
  const distanceToRight = window.innerWidth - positionOfSmileButton.right;
  let topPositionEmojiPanel: string;

  if (distanceToBottom < HEIGHT_EMOJI_PANEL) {
    topPositionEmojiPanel = 'auto';
  } else if (positionOfSmileButton.top < 100) {
    topPositionEmojiPanel = `${positionOfSmileButton.top}px`;
  } else {
    topPositionEmojiPanel = `${positionOfSmileButton.top - 100}px`;
  }

  const setMarginleft = messagesContainerRef?.current?.getBoundingClientRect()
    ? window.innerWidth - messagesContainerRef?.current?.getBoundingClientRect().right + 155
    : 0;


  const handleOnSend = useCallback(async (content: IMessageSendPayload, mentions?: Array<ApiMessageMention>, attachments?: Array<ApiMessageAttachment>, references?: Array<ApiMessageRef>, value?: ThreadValue, anonymous?: boolean, mentionEveryone?: boolean) => {
    try {
      const response = await createDirectMessageWithUser(currentUserDM.id || '');
      const message = await dispatch(messagesActions.sendMessage({
        channelId: response.channel_id ?? '',
        clanId: '',
        mode: ChannelStreamMode.STREAM_MODE_DM,
        isPublic: false,
        content,
        mentions,
        attachments,
        references,
        anonymous,
        mentionEveryone,
        senderId: currentUserDM.id ?? '',
        avatar: currentUserDM.avatarUser || '',
        username: currentUserDM.displayName || currentUserDM.name || '',
      }));
      const link = toDmGroupPage(response.channel_id || '', Number(response.type));
      navigate(link);
    } catch (error) {
      console.error('error: ', error);
    }

  }, [currentUserDM])

  const mentionsList: MentionDataProps[] = useMemo(() => {
    // console.log('currentUserDM: ', currentUserDM);
    const mentionUser: MentionDataProps = {
      id: currentUserDM.id || '',
      avatarUrl: currentUserDM.avatarUser || '',
      clanAvatar: currentUserDM.clanAvatar || '',
      clanNick: currentUserDM.clanNick || '',
      displayName: currentUserDM.displayName || currentUserDM.name || '',
      username: currentUserDM.name,
      display: currentUserDM.displayName || currentUserDM.name || '',
    }
    return [mentionUser]
  }, [currentUserDM])

  return (
    <div className="flex flex-col flex-1 shrink min-w-0 bg-transparent h-[100%] overflow-visible relative">
      <div className="h-heightTopBar">
        {/* DMTopBar */}
        <div
          className={`flex h-heightTopBar p-3 min-w-0 items-center dark:bg-bgPrimary bg-bgLightPrimary shadow border-b-[1px] dark:border-bgTertiary border-bgLightTertiary flex-shrink`}
        >
          <div className="sbm:justify-start justify-between items-center gap-1 flex w-full">
            <div className={`flex flex-row gap-1 items-center flex-1`}>
              <div className={`mx-6 ${closeMenu && !statusMenu ? '' : 'hidden'}`} role="button">
                <Icons.OpenMenu defaultSize={`w-5 h-5`} />
              </div>
              <MemberProfile
                numberCharacterCollapse={22}
                avatar={currentUserDM.avatarUser || ''}
                name={currentUserDM.displayName || currentUserDM.name || ''}
                isHideStatus={true}
                isHiddenAvatarPanel={true}
              />
              <div>{currentUserDM.displayName || currentUserDM.name}</div>
            </div>

            <div className=" items-center h-full ml-auto hidden justify-end ssm:flex">
              <div className=" items-center gap-2 flex">
                <div className="justify-start items-center gap-[15px] flex">
                  <button>
                    <Tippy content="Start voice call" className="tooltip">
                      <span>
                        <Icons.IconPhoneDM />
                      </span>
                    </Tippy>
                  </button>
                  <button>
                    <Tippy content="Start Video Call" className="tooltip">
                      <span>
                        <Icons.IconMeetDM />
                      </span>
                    </Tippy>
                  </button>
                  <button>
                    <Tippy content="Add friends to DM" className="tooltip">
                      <span>
                        <Icons.IconAddFriendDM />
                      </span>
                    </Tippy>
                  </button>
                  <button>
                    <Tippy content="Show User Profile" className="tooltip">
                      <span>
                        <Icons.IconUserProfileDM />
                      </span>
                    </Tippy>
                  </button>
                  <SearchMessageChannel mode={ChannelStreamMode.STREAM_MODE_DM} />
                  <button>
                    <Tippy content="Inbox" className="tooltip">
                      <span>
                        <Icons.Inbox />
                      </span>
                    </Tippy>
                  </button>
                  <button>
                    <Tippy content="Inbox" className="tooltip">
                      <span>
                        <Icons.Help />
                      </span>
                    </Tippy>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={`flex flex-row flex-1 w-full`}>
        <div
          className={`flex-col flex-1 h-full ${isWindowsDesktop || isLinuxDesktop ? 'max-h-titleBarMessageViewChatDM' : 'max-h-messageViewChatDM'}  w-full sbm:flex hidden`}
        >
          <div
            className={`overflow-y-auto  ${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarMessageViewChatDM' : 'h-heightMessageViewChatDM'} flex-shrink`}
            ref={messagesContainerRef}
          >
            {/* Channel message/ ChatWelCome */}
            <div className="flex flex-col gap-3">
              <div className="space-y-2 px-4 mb-0  flex-1 flex flex-col justify-end">
                {/*WelComeDm */}
                <AvatarImage
                  height={'75px'}
                  alt={currentUserDM.name || ''}
                  userName={currentUserDM.name || ''}
                  className="min-w-[75px] min-h-[75px] max-w-[75px] max-h-[75px] font-semibold"
                  srcImgProxy={createImgproxyUrl(currentUserDM.avatarUser ?? '', {
                    width: 300,
                    height: 300,
                    resizeType: 'fit'
                  })}
                  src={currentUserDM.avatarUser}
                  classNameText="!text-4xl font-semibold"
                />
                <div>
                  <p className="text-xl md:text-3xl font-bold pt-1 dark:text-white text-black" style={{ wordBreak: 'break-word' }}>
                    {currentUserDM.displayName || currentUserDM.name}
                  </p>
                </div>
                {<p className="font-medium text-2xl dark:text-textDarkTheme text-textLightTheme">{currentUserDM.name}</p>}
                <div className="text-base">
                  <p className="dark:text-zinc-400 text-colorTextLightMode text-sm">
                    This is the beginning of your direct message history with {currentUserDM.name}
                  </p>
                </div>
                {<StatusFriend userName={currentUserDM.name} checkAddFriend={checkAddFriend} userID={currentUserDM.id || ''} />}
              </div>
            </div>
          </div>

          {subPanelActive === SubPanelName.EMOJI_REACTION_RIGHT && (
            <div
              id="emojiPicker"
              className={`z-20 fixed size-[500px] max-sm:hidden right-1 ${closeMenu && !statusMenu && 'w-[370px]'}`}
              style={{
                right: setMarginleft
              }}
            >
              <div className="mb-0 z-10 h-full">
                <GifStickerEmojiPopup mode={ChannelStreamMode.STREAM_MODE_DM} emojiAction={EmojiPlaces.EMOJI_REACTION} />
              </div>
            </div>
          )}
          {subPanelActive === SubPanelName.EMOJI_REACTION_BOTTOM && (
            <div
              className={`fixed z-50 max-sm:hidden duration-300 ease-in-out animate-fly_in`}
              style={{
                top: topPositionEmojiPanel,
                bottom: distanceToBottom < HEIGHT_EMOJI_PANEL ? '0' : 'auto',
                left:
                  distanceToRight < WIDTH_EMOJI_PANEL
                    ? `${positionOfSmileButton.left - WIDTH_EMOJI_PANEL}px`
                    : `${positionOfSmileButton.right}px`
              }}
            >
              <div className="mb-0 z-50 h-full ">
                <GifStickerEmojiPopup mode={ChannelStreamMode.STREAM_MODE_DM} emojiAction={EmojiPlaces.EMOJI_REACTION} />
              </div>
            </div>
          )}

          <div className="flex-shrink-0 flex flex-col z-0 dark:bg-bgPrimary bg-bgLightPrimary h-auto relative">
            <MessageBox onSend={handleOnSend} listMentions={mentionsList} currentChannelId='temporary' currentClanId='temporary' mode={ChannelStreamMode.STREAM_MODE_DM} key={'temporary'} />
          </div>

          <div className="flex-shrink-0 flex flex-col z-0 dark:bg-bgPrimary bg-bgLightPrimary h-auto relative"></div>
        </div>
        <div className="w-1 h-full dark:bg-bgPrimary bg-bgLightPrimary"></div>
      </div>
    </div>
  );
};

export default memo(DirectMessageTemporary);
