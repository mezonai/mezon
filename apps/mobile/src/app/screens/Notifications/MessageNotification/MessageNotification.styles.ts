import { Colors, size } from "@mezon/mobile-ui";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  tapToSeeAttachmentText: {
		color: Colors.tertiary,
		fontSize: size.medium,
	},
  attachmentBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: size.s_4
  }
});
