"""Trusted helper-only unit fixtures. No learner or language reference code executes."""
import unittest
from trusted_structures import CwContext,ListNode,GraphNode,TreeNode
class Helpers(unittest.TestCase):
    def test_same_values_do_not_equate_identity(self):
        c=CwContext();data=c.identity_list({'values':[7,7],'next':[1,None],'heads':[0,1]})
        self.assertEqual(c.list_identity(data.heads[0]),0)
        self.assertEqual(c.list_identity(data.heads[1]),1)
        self.assertNotEqual(c.list_identity(data.heads[0]),c.list_identity(data.heads[1]))
    def test_cycles_and_aliases_preserved(self):
        c=CwContext();d=c.identity_list({'values':[1,1],'next':[1,0],'random':[1,0],'heads':[0,1,0]})
        self.assertIs(d.heads[0],d.heads[2]);self.assertIs(d.nodes[1].next,d.nodes[0])
        original=c.clone_list(d.heads[0]);self.assertTrue(original['aliasesOriginal'])
        a,b=ListNode(1),ListNode(1);a.next=b;b.next=a;a.random=b;b.random=a
        clone=c.clone_list(a);self.assertFalse(clone['aliasesOriginal'])
        self.assertEqual({k:v for k,v in original.items() if k!='aliasesOriginal'},{k:v for k,v in clone.items() if k!='aliasesOriginal'})
    def test_graph_duplicates_and_alias_return_detected(self):
        c=CwContext();root=c.graph({'values':[5,5],'neighbors':[[1],[0,1]],'root':0})
        self.assertTrue(c.clone_graph(root)['aliasesOriginal'])
        a,b=GraphNode(5),GraphNode(5);a.neighbors=[b];b.neighbors=[a,b]
        clone=c.clone_graph(a);self.assertFalse(clone['aliasesOriginal']);self.assertEqual(clone['neighbors'],[[1],[0,1]])
        collapsed=GraphNode(5);collapsed.neighbors=[collapsed]
        self.assertNotEqual(c.clone_graph(collapsed)['values'],clone['values'])
    def test_sparse_tree_and_invalid_alias(self):
        c=CwContext();root=c.tree([4,None,4,2]);self.assertEqual(c.tree_values(root),[4,None,4,2]);self.assertEqual(c.tree_identity(root.right),2)
        root.left=root.right
        with self.assertRaises(ValueError):c.tree_values(root)
    def test_list_cycle_rejected_for_value_list(self):
        c=CwContext();root=c.list([1,2]);self.assertEqual(c.list_values(root),[1,2]);root.next.next=root
        with self.assertRaises(ValueError):c.list_values(root)
    def test_readonly_unchanged_and_restored_links_pass(self):
        c=CwContext();d=c.identity_list({'values':[7,7],'next':[1,0],'random':[1,1],'heads':[0]})
        c.snapshot_inputs();c.check_inputs()
        old=d.nodes[0].next;d.nodes[0].next=None;d.nodes[0].next=old
        c.check_inputs()
        self.assertEqual(c.list_identity(d.nodes[1]),1)
    def test_readonly_equal_value_replacement_is_rejected(self):
        c=CwContext();head=c.list([7,7]);c.snapshot_inputs()
        head.next=ListNode(7)
        with self.assertRaises(ValueError):c.check_inputs()
    def test_readonly_list_value_and_random_changes_rejected(self):
        for field,replacement in [('val',9),('next',None),('random',None)]:
            c=CwContext();d=c.identity_list({'values':[7,7],'next':[1,None],'random':[1,0],'heads':[0]});c.snapshot_inputs()
            setattr(d.nodes[0],field,replacement)
            with self.assertRaises(ValueError):c.check_inputs()
    def test_readonly_checks_all_original_nodes_and_multiple_arguments(self):
        c=CwContext();first=c.list([1,2]);second=c.list([3,4]);c.snapshot_inputs()
        second.next.val=5
        with self.assertRaises(ValueError):c.check_inputs()
    def test_readonly_tree_identity_not_equal_values(self):
        c=CwContext();root=c.tree([5,7,7]);c.snapshot_inputs();c.check_inputs()
        root.left=root.right
        with self.assertRaises(ValueError):c.check_inputs()
    def test_readonly_graph_neighbor_order_and_value(self):
        for change in ['order','value','extra']:
            c=CwContext();root=c.graph({'values':[1,7,7],'neighbors':[[1,2],[0],[0]],'root':0});c.snapshot_inputs();c.check_inputs()
            if change=='order':root.neighbors.reverse()
            elif change=='value':root.val=2
            else:root.neighbors.append(root.neighbors[0])
            with self.assertRaises(ValueError):c.check_inputs()
    def test_readonly_requires_snapshot_and_accepts_empty(self):
        c=CwContext()
        with self.assertRaises(ValueError):c.check_inputs()
        c.snapshot_inputs();c.check_inputs()
if __name__=='__main__':unittest.main()
