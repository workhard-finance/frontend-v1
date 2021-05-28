import React from "react";
import { useRouteMatch } from "react-router-dom";
import { Container, Row } from "react-bootstrap";
import WorkIcon from "../components/icons/WorkIcon";
import GovIcon from "../components/icons/GovIcon";
import StoreIcon from "../components/icons/StoreIcon";
import MineIcon from "../components/icons/MineIcon";
import DupIcon from "../components/icons/DupIcon";
import NavBar from "../components/nav/NavBar";
import Footer from "../components/Footer";
import { Menu } from "../contexts/menu";
import { prefix } from "../utils/utils";

export type PageProps = React.ComponentProps<any>;

const Page = (props: React.ComponentProps<any>) => {
  const match = useRouteMatch<{ daoId?: string }>("/:daoId?/");
  const parsed = parseInt(match?.params.daoId || "0");
  const daoId = Number.isNaN(parsed) ? 0 : parsed;
  let menus: Menu[];
  let secondary: Menu[] | undefined;
  if (daoId === 0) {
    menus = [
      {
        Icon: WorkIcon,
        name: "Work",
        url: "/work",
      },
      {
        Icon: MineIcon,
        name: "Mine",
        url: "/mine",
      },
      {
        Icon: GovIcon,
        name: "Gov",
        url: "/gov",
      },
      // {
      //   Icon: StoreIcon,
      //   name: "NFTs",
      //   url: "/nfts",
      // },
      {
        Icon: DupIcon,
        name: "Fork",
        url: "/fork",
      },
    ];
  } else {
    menus = [
      {
        Icon: StoreIcon,
        name: "NFTs",
        url: prefix(daoId, "/nfts"),
      },
    ];
    secondary = [
      {
        Icon: WorkIcon,
        name: "Work",
        url: prefix(daoId, "/work"),
      },
      {
        Icon: MineIcon,
        name: "Mine",
        url: prefix(daoId, "/mine"),
      },
      {
        Icon: GovIcon,
        name: "Gov",
        url: prefix(daoId, "/gov"),
      },
    ];
  }
  return (
    <Container style={{ minHeight: "100vh" }}>
      <br />
      <NavBar menus={menus} secondary={secondary} />
      <br />
      <Row>
        <Container>{props.children}</Container>
      </Row>
      <br />
      <Footer />
    </Container>
  );
};

export default Page;
