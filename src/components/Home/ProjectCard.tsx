import React, { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
import withStyles from "./styles";
import { makeStyles } from "@material-ui/styles";
import { red } from "@material-ui/core/colors";
import { SVGComponents } from "../Profile/SVGPaths";

import {
    ProjectCardContainer,
    ProjectCardSVGContainer,
    ProjectCardContentContainer,
    ProjectCardContentTop,
    ProjectCardContentBottom,
    ProjectCardContentTopHeader,
    ProjectCardContentTopDescription,
    ProjectCardContentMiddle,
    ProjectCardContentBottomPhoto,
    ProjectCardContentBottomHeader,
    ProjectCardContentBottomDescription,
    StyledIconButton,
    Photo,
    ProjectCardContentBottomID
} from "./HomeUI";
import PlayIcon from "@material-ui/icons/PlayCircleFilledRounded";
// import PauseIcon from "@material-ui/icons/PauseCircleFilledRounded";

const useStyles = makeStyles(theme => ({
    card: {
        maxWidth: 360,
        padding: 10,
        height: 360
    },
    media: {
        height: 100
    },
    avatar: {
        backgroundColor: red[500]
    },
    largeButton: {},
    largeIcon: {
        fontSize: "4em"
    }
}));

const ProjectCard = props => {
    const classes = useStyles();
    const [project, setProject] = useState();
    const {
        duration,
        projectIndex,
        projectColumnCount,
        transitionStatus
    } = props;
    let {
        description,
        iconName,
        iconBackgroundColor,
        iconForegroundColor,
        name
    } = props.project;

    const { photoUrl, displayName, bio } = props.profile;

    // const listPlayState = "paused";
    // const currentlyPlayingProject = id;

    const [mouseOver, setMouseOver] = useState(false);

    iconName =
        iconName === "" || typeof iconName === "undefined"
            ? "fadwaveform"
            : iconName;

    const SVGIcon = SVGComponents[`${iconName}Component`];
    return (
        <ProjectCardContainer
            duration={duration}
            projectIndex={projectIndex}
            projectColumnCount={projectColumnCount}
            onMouseOver={() => {
                setMouseOver(true);
            }}
            onMouseLeave={() => setMouseOver(false)}
            className={transitionStatus}
        >
            <ProjectCardSVGContainer
                mouseOver={mouseOver}
                backgroundColor={iconBackgroundColor}
            >
                <SVGIcon
                    height="100%"
                    width="100%"
                    fill={iconForegroundColor}
                />
            </ProjectCardSVGContainer>
            <ProjectCardContentContainer>
                <ProjectCardContentTop>
                    <ProjectCardContentTopHeader>
                        {name}
                    </ProjectCardContentTopHeader>
                    <ProjectCardContentTopDescription>
                        {description}
                    </ProjectCardContentTopDescription>
                </ProjectCardContentTop>
                <ProjectCardContentMiddle>
                    <StyledIconButton
                        size="small"
                        className={classes.largeButton}
                        onClick={e => {
                            e.stopPropagation();
                            // dispatch(playListItem(projectUid));
                        }}
                    >
                        <PlayIcon
                            fontSize="large"
                            className={classes.largeIcon}
                            style={
                                {
                                    // color: theme.profilePlayButton.primary
                                }
                            }
                        />
                    </StyledIconButton>
                </ProjectCardContentMiddle>
                <ProjectCardContentBottom>
                    <ProjectCardContentBottomPhoto>
                        <Photo src={photoUrl} />
                    </ProjectCardContentBottomPhoto>
                    <ProjectCardContentBottomID>
                        <ProjectCardContentBottomHeader>
                            {displayName}
                        </ProjectCardContentBottomHeader>
                        <ProjectCardContentBottomDescription>
                            {bio}
                        </ProjectCardContentBottomDescription>
                    </ProjectCardContentBottomID>
                </ProjectCardContentBottom>
            </ProjectCardContentContainer>
        </ProjectCardContainer>
    );
};

export default withStyles(ProjectCard);
