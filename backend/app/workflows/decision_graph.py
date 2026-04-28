from langgraph.graph import StateGraph, END

from app.workflows.graph_state import DecisionGraphState
from app.workflows.decision_nodes import (
    validate_fields_node,
    score_risk_node,
    make_decision_node,
    human_review_required_node,
    resume_after_review_node,
    finalize_case_node,
    decision_router,
)


def build_decision_graph():
    graph = StateGraph(DecisionGraphState)

    graph.add_node("validate_fields", validate_fields_node)
    graph.add_node("score_risk", score_risk_node)
    graph.add_node("make_decision", make_decision_node)
    graph.add_node("human_review", human_review_required_node)
    graph.add_node("resume_after_review", resume_after_review_node)
    graph.add_node("finalize", finalize_case_node)

    graph.set_entry_point("validate_fields")

    graph.add_edge("validate_fields", "score_risk")
    graph.add_edge("score_risk", "make_decision")

    graph.add_conditional_edges(
        "make_decision",
        decision_router,
        {
            "human_review": "human_review",
            "finalize": "finalize",
        },
    )

    graph.add_edge("human_review", END)
    graph.add_edge("resume_after_review", "finalize")
    graph.add_edge("finalize", END)

    return graph.compile()