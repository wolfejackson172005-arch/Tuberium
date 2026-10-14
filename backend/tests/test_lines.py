from app.engine.engine import can_talk, fill_goal
from app.models import System


def test_two_way_lines_work_both_ways(hello: System) -> None:
    assert can_talk(hello, "overseer", "researcher")
    assert can_talk(hello, "researcher", "overseer")


def test_one_way_lines_only_work_from_their_start(hello: System) -> None:
    assert can_talk(hello, "researcher", "writer")
    assert not can_talk(hello, "writer", "researcher")


def test_no_line_means_no_talking(hello: System) -> None:
    assert not can_talk(hello, "writer", "nobody")


def test_goal_inputs_are_filled_and_unknown_ones_left_alone() -> None:
    assert fill_goal("A fact about {{topic}}.", {"topic": "squid"}) == "A fact about squid."
    assert fill_goal("A fact about {{ topic }}.", {"topic": "squid"}) == "A fact about squid."
    assert fill_goal("A fact about {{other}}.", {"topic": "squid"}) == "A fact about {{other}}."
