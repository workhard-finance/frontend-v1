import React from "react";
import home from "../../svgs/home-button.svg";

const LandingIcon = (
  props: JSX.IntrinsicAttributes &
    React.ClassAttributes<HTMLImageElement> &
    React.ImgHTMLAttributes<HTMLImageElement>
) => <img {...props} src={home} alt="home" />;

export default LandingIcon;
