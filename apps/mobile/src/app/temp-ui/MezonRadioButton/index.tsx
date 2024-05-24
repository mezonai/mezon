import React, {useState} from 'react';
import { TouchableOpacity} from 'react-native';

import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  Extrapolate,
  interpolateColor,
} from 'react-native-reanimated';
import { styles } from './MezonToggleButton.styles';
import { Colors } from '@mezon/mobile-ui';

const SWITCH_BUTTON_PADDING = 4;
const InterpolateXInput = [0, 1];

const MezonToggleButton = ({
  onChange,
  value = false,
  containerStyle ={},
  toggleOffColor = Colors.bgToggleOffBtn,
  toggleOnColor = Colors.bgToggleOnBtn,
  toggleBgOnColor = Colors.bgToggleOnBtn,
  toggleBgOffColor = Colors.bgToggleOnBtn,
  height = 80,
  width = 150,
}) => {
  const BUTTON_WIDTH = width;
  const BUTTON_HEIGHT = height;
  const SWITCH_BUTTON_AREA = BUTTON_HEIGHT - SWITCH_BUTTON_PADDING;
  const [toggled, setToggled] = useState(value);
  const shareValue = useSharedValue(value ? 1 : 0);
  const bgColorBtn = toggled ? toggleBgOnColor : toggleBgOffColor;

  const containerScale = {
    height: BUTTON_HEIGHT,
    width: BUTTON_WIDTH,
  };
  const switchScale = {
    height: SWITCH_BUTTON_AREA,
    width: SWITCH_BUTTON_AREA,
  };

  const onChangeToggle = () => {
    setToggled(!toggled);
    onChange?.(!toggled);
  };

  const onPressSwitch = () => {
    if (shareValue.value === 0) {
      shareValue.value = withTiming(1, {
        duration: 800,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      });
    } else {
      shareValue.value = withTiming(0, {
        duration: 800,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      });
    }
    onChangeToggle();
  };

  const switchAreaStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            shareValue.value,
            InterpolateXInput,
            [0, BUTTON_WIDTH - SWITCH_BUTTON_AREA - 2 * SWITCH_BUTTON_PADDING],
            Extrapolate.CLAMP,
          ),
        },
      ],
      backgroundColor: interpolateColor(shareValue.value, InterpolateXInput, [
        toggleOffColor,
        toggleOnColor,
      ]),
    };
  });



  return (
    <TouchableOpacity
      onPress={onPressSwitch}
      activeOpacity={1}
      style={[styles.containerStyle, containerScale, containerStyle, {backgroundColor: bgColorBtn}]}>
      <Animated.View
        style={[styles.switchButton, switchScale, switchAreaStyles]}
      />
    </TouchableOpacity>
  );
};

export default MezonToggleButton;
