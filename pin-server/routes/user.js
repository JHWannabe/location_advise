const express = require("express");
const passport = require("passport");
const utils = require("../libs/utils");
const { sequelize, User, Pin, Group, Follow } = require("../models");

const router = express.Router();

// 회원 정보 조회
router.get("/", async (req, res) => {
  try {
    if (req.user) {
      const userId = req.user.userId;
      const user = await User.findOne({
        where: { userId },
      });
      res.status(200).json(user);
    } else {
      res.status(401).json({ message: "no user in session" });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "error" });
  }
});

// 회원가입 라우터
router.post("/", async (req, res) => {
  const t = await sequelize.transaction();
  const { email, nickname, password } = req.body;
  try {
    const exUser = await User.findOne({ where: { email } });
    if (exUser) {
      res.status(400).json({ message: "already joined user" });
    }
    const userDto = await User.create(req.body, { transaction: t });
    await Group.create(
      {
        userId: userDto.userId,
        name: "기본그룹",
      },
      { transaction: t }
    );
    await t.commit();
    res.status(200).json(userDto);
  } catch (error) {
    console.error(error);
    await t.rollback();
    res.status(400).json({ message: "error" });
  }
});

// 로그인 라우터
router.post("/login", async (req, res) => {
  passport.authenticate("local", (authError, user, info) => {
    if (authError) {
      console.error(authError);
      res.status(400).json({ message: "Auth Error" });
    }
    if (!user) {
      console.error(info.message);
      res.status(400).json({ message: "Login Error" });
    }
    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        res.status(400).json({ message: "Login Error" });
      }
      res.status(200).json({ message: "success" });
    });
  })(req, res);
});

// 로그아웃 라우터
router.get("/logout", async (req, res) => {
  req.logout();
  req.session.destroy();
  res.status(200).json({ message: "success" });
});

// 핀 추가
router.post("/pin", async (req, res) => {
  try {
    if (req.user) {
      const userId = req.user.userId;
      const groupId =
        req.body.groupId == -1
          ? await utils.getDefaultGroupId(userId)
          : req.body.groupId;
      const pinDto = await Pin.create({
        name: req.body.name,
        address: req.body.address,
        categoryId: req.body.categoryId,
        emotionId: req.body.emotionId,
        groupId,
      });
      res.status(200).json(pinDto);
    } else {
      res.status(401).json({ message: "no user in session" });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "error" });
  }
});

// 핀 수정
router.patch("/pin/:pinId", async (req, res) => {
  try {
    await Pin.update(req.body, { where: { pinId: req.params.pinId } });
    res.status(200).json({ message: "success" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "error" });
  }
});

// 핀 삭제
router.delete("/pin/:pinId", async (req, res) => {
  try {
    await Pin.destroy({
      where: { pinId: req.params.pinId },
    });
    res.status(200).json({ message: "success" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "error" });
  }
});

// 그룹 목록 조회
router.get("/groups", async (req, res) => {
  try {
    if (req.user) {
      const userId = req.user.userId;
      const groupItemDtos = await sequelize.query(`
      SELECT G.groupId, G.name, count(P.pinId) AS 'count'
      FROM pin.group G
      JOIN pin.pin P
      ON P.groupId = G.groupId
      WHERE G.userId = ${userId}
      AND P.createdAt >= date_add(now(), interval -3 year)
      GROUP BY groupId;
      `);
      res.status(200).json(groupItemDtos[0]);
    } else {
      res.status(401).json({ message: "no user in session" });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "error" });
  }
});

// 그룹 추가
router.post("/group", async (req, res) => {
  try {
    if (req.user) {
      const userId = req.user.userId;
      const groupDto = await Group.create({
        userId,
        name: req.body.name,
      });
      res.status(200).json(groupDto);
    } else {
      res.status(401).json({ message: "no user in session" });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "error" });
  }
});

// 그룹 삭제
router.delete("/group/:groupId", async (req, res) => {
  try {
    await Group.destroy({
      where: { groupId: req.params.groupId },
    });
    res.status(200).json({ message: "success" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "error" });
  }
});

// 그룹에 속한 핀 조회
router.get("/group/:groupId/pins", async (req, res) => {
  try {
    const groupId = req.params.groupId == -1 ? null : req.params.groupId;
    const pinItemDtos = await sequelize.query(`
    SELECT P.pinId, U.name AS 'userName', P.name, P.address, P.categoryId, P.emotionId, G.name AS 'groupName'
    FROM pin.pin P 
    JOIN pin.group G
    ON G.groupId = P.groupId
    JOIN pin.user U
    ON G.userId = U.userId
    WHERE P.groupId=${groupId}
    AND P.createdAt >= date_add(now(), interval -3 year)
    `);
    res.status(200).json(pinItemDtos[0]);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "error" });
  }
});

// 해당 유저의 모든 팔로잉 조회
router.get("/following", async (req, res) => {
  try {
    if (req.user) {
      const userId = req.user.userId;
      const UserDtos = await Follow.findAll({
        where: { followerId: userId },
        include: { model: User },
      });
      res.status(200).json(UserDtos);
    } else {
      res.status(401).json({ message: "no user in session" });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "error" });
  }
});

// 팔로잉 추가
router.post("/following", async (req, res) => {
  try {
    if (req.user) {
      const userId = req.user.userId;
      const exFollow = await Follow.findOne({
        where: { followerId: userId, followingId: req.body.userId },
      });

      if (exFollow) {
        res.status(400).json({ message: "duplicated follow" });
      } else {
        const follow = await Follow.create({
          followerId: userId,
          followingId: req.body.userId,
        });
        res.status(200).json(follow);
      }
    } else {
      res.status(401).json({ message: "no user in session" });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "error" });
  }
});

// 팔로잉 삭제
router.delete("/following/:userId", async (req, res) => {
  try {
    const userId = req.user.userId;
    await Follow.destroy({
      where: { followerId: userId, followingId: req.params.userId },
    });
    res.status(200).json({ message: "success" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "error" });
  }
});

// top3 카테고리 목록 조회
router.get("/categories/topThree", async (req, res) => {
  try {
    if (req.user) {
      const userId = req.user.userId;
      const categoryDtos = await sequelize.query(`
      SELECT C.categoryId, C.name, count(P.pinId) AS "pinCount"
      FROM pin.pin P 
      JOIN pin.group G
      ON G.groupId = P.groupId
      JOIN pin.category C
      ON P.categoryId = C.categoryId
      WHERE G.userId = ${userId} AND P.createdAt >= date_add(now(), interval -3 year)
      GROUP BY P.categoryId
      ORDER BY pinCount DESC
      LIMIT 3
      ;
      `);
      res.status(200).json(categoryDtos[0]);
    } else {
      res.status(401).json({ message: "no user in session" });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "error" });
  }
});

module.exports = router;
