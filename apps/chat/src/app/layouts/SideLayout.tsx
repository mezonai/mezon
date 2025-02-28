import { selectCurrentChannel, selectCurrentClan, selectIsShowChatStream, selectIsShowCreateThread, selectIsShowCreateTopic, threadsActions, topicsActions } from "@mezon/store";
import { useDispatch, useSelector } from "react-redux";
import ThreadsMain from "../pages/thread";
import TopicDiscussionMain from "../pages/topicDiscussion";
import { SubPanelName } from "@mezon/utils";
import { useGifsStickersEmoji } from "@mezon/core";
import { ChannelType } from "mezon-js";
import { useRef } from "react";
import ChatStream from "../pages/chatStream";
import isElectron from "is-electron";

const SideLayout = () => {

  const currentChannel = useSelector(selectCurrentChannel);
  const isShowCreateThread = useSelector((state) => selectIsShowCreateThread(state, currentChannel?.id as string));
  const isShowCreateTopic = useSelector(selectIsShowCreateTopic);
  const dispatch = useDispatch();
  const { setSubPanelActive } = useGifsStickersEmoji();
  const chatStreamRef = useRef<HTMLDivElement | null>(null);
  const currentURL = isElectron() ? location.hash : location.pathname;
  const isShowChatStream = useSelector(selectIsShowChatStream);
  const currentClan = useSelector(selectCurrentClan);
  const memberPath = `/chat/clans/${currentClan?.clan_id}/member-safety`;

  const onMouseDownTopicBox = () => {
    setSubPanelActive(SubPanelName.NONE);
    dispatch(topicsActions.setFocusTopicBox(true));
    dispatch(threadsActions.setFocusThreadBox(false));
  };
  const onMouseDownThreadBox = () => {
    setSubPanelActive(SubPanelName.NONE);
    dispatch(topicsActions.setFocusTopicBox(false));
    dispatch(threadsActions.setFocusThreadBox(true));
  };

  return (
    <div className="w-[510px] dark:bg-bgPrimary bg-bgLightPrimary rounded-l-lg">

      {isShowCreateThread && !isShowCreateTopic && (
        <div onMouseDown={onMouseDownThreadBox} >
          <ThreadsMain />
        </div>
      )}

      {isShowCreateTopic && !isShowCreateThread && (
        <div onMouseDown={onMouseDownTopicBox}>
          <TopicDiscussionMain />
        </div>
      )}

      {isShowChatStream && currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING && memberPath !== currentURL && (
        <div
          ref={chatStreamRef}
          className="flex flex-col flex-1"
        >
          <ChatStream currentChannel={currentChannel} />
        </div>
      )}
    </div>
  )
}

export default SideLayout;